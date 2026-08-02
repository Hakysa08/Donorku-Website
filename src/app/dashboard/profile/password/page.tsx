"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Eye, EyeOff } from "lucide-react";

import AskModal from "@/components/AskModal";
import SuccessModal from "@/components/SuccessModal";

import { fotoProfilAdmin } from "@/lib/fotoProfil";

/* =========================================================
   TYPE
========================================================= */

type FormPassword = {
  password_lama: string;
  password_baru: string;
  konfirmasi_password: string;
};

const INITIAL_FORM: FormPassword = {
  password_lama: "",
  password_baru: "",
  konfirmasi_password: "",
};

/* =========================================================
   INPUT PASSWORD
========================================================= */

function KolomPassword({
  label,
  name,
  value,
  placeholder,
  terlihat,
  onToggle,
  onChange,
}: {
  label: string;
  name: keyof FormPassword;
  value: string;
  placeholder: string;
  terlihat: boolean;
  onToggle: () => void;
  onChange: (
    e: ChangeEvent<HTMLInputElement>
  ) => void;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <label
        htmlFor={name}
        className="mb-2 block text-xl font-bold text-black"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          type={
            terlihat
              ? "text"
              : "password"
          }
          placeholder={placeholder}
          className="h-14 w-full rounded-lg border border-gray-200 bg-white px-4 pr-14 text-base text-black shadow-sm outline-none transition duration-200 placeholder:text-gray-400 focus:border-red-300 focus:ring-2 focus:ring-red-100"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={
            terlihat
              ? "Sembunyikan password"
              : "Tampilkan password"
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors duration-200 hover:text-black"
        >
          {terlihat ? (
            <Eye size={20} />
          ) : (
            <EyeOff size={20} />
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function EditPasswordPage() {
  const router = useRouter();

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState<FormPassword>(INITIAL_FORM);

  const [terlihat, setTerlihat] =
    useState({
      password_lama: false,
      password_baru: false,
      konfirmasi_password: false,
    });

  /* =======================================================
     PROFIL
  ======================================================= */

  const [nama, setNama] =
    useState("");

  const [foto, setFoto] = useState(
    fotoProfilAdmin(null)
  );

  /* =======================================================
     STATUS
  ======================================================= */

  const [saving, setSaving] =
    useState(false);

  const [pesanGagal, setPesanGagal] =
    useState("");

  /* =======================================================
     MODAL
  ======================================================= */

  const [konfirmasiSimpan, setKonfirmasiSimpan] =
    useState(false);

  const [konfirmasiBatal, setKonfirmasiBatal] =
    useState(false);

  const [sukses, setSukses] =
    useState(false);

  const [gagal, setGagal] =
    useState(false);

  /* =======================================================
     AMBIL PROFIL
  ======================================================= */

  useEffect(() => {
    async function ambilProfil() {
      try {
        const response = await fetch(
          "/api/web/auth/dashboard/profile",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!response.ok) {
          return;
        }

        const result =
          await response.json();

        setNama(
          result.data.nama_admin ?? ""
        );

        setFoto(
          fotoProfilAdmin(
            result.data.foto_profil
          )
        );
      } catch (error) {
        console.error(
          "GET PROFIL ERROR:",
          error
        );
      }
    }

    ambilProfil();
  }, []);

  /* =======================================================
     UBAH FORM
  ======================================================= */

  function ubahForm(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setForm((sebelumnya) => ({
      ...sebelumnya,
      [name]: value,
    }));
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  function bukaKonfirmasi(
    e: FormEvent
  ) {
    e.preventDefault();

    setKonfirmasiSimpan(true);
  }

  async function simpanPassword() {
    try {
      setSaving(true);

      setKonfirmasiSimpan(false);

      const response = await fetch(
        "/api/web/auth/dashboard/profile/password",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify(form),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        setPesanGagal(
          result.message ||
            "Anda salah memasukan password lama atau konfirmasi password"
        );

        setGagal(true);

        return;
      }

      setSukses(true);
    } catch (error) {
      console.error(error);

      setPesanGagal(
        "Terjadi kesalahan saat mengubah password"
      );

      setGagal(true);
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     SELESAI

     Password sudah berganti, jadi sesi lama dihentikan
     dan administrator diminta login kembali.
  ======================================================= */

  async function keluarSetelahGanti() {
    try {
      await fetch(
        "/api/web/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );
    } finally {
      router.push("/login");

      router.refresh();
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7">

      {/* ===================================================
          HEADER
      =================================================== */}

      <h1 className="text-[36px] font-bold leading-tight tracking-tight text-black">
        Profil Administrator
      </h1>

      {/* ===================================================
          FOTO DAN NAMA
      =================================================== */}

      <div className="mt-6 flex items-start gap-8">
        <span className="relative h-[190px] w-[190px] shrink-0 overflow-hidden bg-gray-100 shadow-md">
          <Image
            src={foto}
            alt={nama || "Foto profil"}
            fill
            sizes="190px"
            className="object-cover"
          />
        </span>

        <p className="mt-8 text-2xl font-bold text-black">
          {nama}
        </p>
      </div>

      {/* ===================================================
          FORM
      =================================================== */}

      <form
        onSubmit={bukaKonfirmasi}
        className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >

        <KolomPassword
          label="Password Lama"
          name="password_lama"
          value={form.password_lama}
          placeholder="Masukan Password Lama mu"
          terlihat={
            terlihat.password_lama
          }
          onToggle={() =>
            setTerlihat(
              (sebelumnya) => ({
                ...sebelumnya,
                password_lama:
                  !sebelumnya.password_lama,
              })
            )
          }
          onChange={ubahForm}
        />

        <KolomPassword
          label="Password Baru"
          name="password_baru"
          value={form.password_baru}
          placeholder="Masukan Password Baru"
          terlihat={
            terlihat.password_baru
          }
          onToggle={() =>
            setTerlihat(
              (sebelumnya) => ({
                ...sebelumnya,
                password_baru:
                  !sebelumnya.password_baru,
              })
            )
          }
          onChange={ubahForm}
        />

        <KolomPassword
          label="Konfirmasi Password"
          name="konfirmasi_password"
          value={
            form.konfirmasi_password
          }
          placeholder="Masukan Kembali Password Baru"
          terlihat={
            terlihat.konfirmasi_password
          }
          onToggle={() =>
            setTerlihat(
              (sebelumnya) => ({
                ...sebelumnya,
                konfirmasi_password:
                  !sebelumnya.konfirmasi_password,
              })
            )
          }
          onChange={ubahForm}
        />

        {/* =================================================
            TOMBOL
        ================================================= */}

        <div className="mt-16 flex justify-end gap-4">

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              setKonfirmasiBatal(true)
            }
            className="flex h-12 w-[200px] items-center justify-center rounded-lg border border-[#EC2727] bg-white text-base font-bold text-[#EC2727] shadow-sm transition-colors duration-200 hover:bg-red-50 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex h-12 w-[240px] items-center justify-center rounded-lg bg-[#EC2727] text-base font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#d31f1f] disabled:opacity-50"
          >
            {saving
              ? "Menyimpan..."
              : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      {/* ===================================================
          KONFIRMASI UBAH
      =================================================== */}

      <AskModal
        isOpen={konfirmasiSimpan}
        variant="tanya"
        title="Konfirmasi Ubah"
        description="Apakah anda yakin ingin mengubah password saat ini?"
        buttonLabel="Ubah"
        cancelLabel="Batal"
        onConfirm={simpanPassword}
        onClose={() =>
          setKonfirmasiSimpan(false)
        }
      />

      {/* ===================================================
          KONFIRMASI BATAL
      =================================================== */}

      <AskModal
        isOpen={konfirmasiBatal}
        variant="tanya"
        title="Konfirmasi Batal"
        description="Apakah anda yakin ingin membatalkan? (Data tidak akan tersimpan)"
        buttonLabel="Kembali"
        cancelLabel="Batal"
        onConfirm={() =>
          router.push(
            "/dashboard/profile"
          )
        }
        onClose={() =>
          setKonfirmasiBatal(false)
        }
      />

      {/* ===================================================
          BERHASIL
      =================================================== */}

      <SuccessModal
        isOpen={sukses}
        variant="success"
        title="Password Berhasil Diganti"
        description="Anda telah berhasil mengganti password baru. Silahkan coba login kembali"
        buttonLabel="Kembali"
        onClose={keluarSetelahGanti}
      />

      {/* ===================================================
          GAGAL
      =================================================== */}

      <SuccessModal
        isOpen={gagal}
        variant="error"
        title="Password Salah"
        description={pesanGagal}
        buttonLabel="Coba Lagi"
        onClose={() => setGagal(false)}
      />
    </div>
  );
}
