"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import AskModal from "@/components/AskModal";
import SuccessModal from "@/components/SuccessModal";

import { fotoProfilAdmin } from "@/lib/fotoProfil";

/* =========================================================
   TYPE
========================================================= */

type FormProfil = {
  nama_admin: string;
  email: string;
  no_hp: string;
  alamat: string;
};

const INITIAL_FORM: FormProfil = {
  nama_admin: "",
  email: "",
  no_hp: "",
  alamat: "",
};

/* =========================================================
   INPUT
========================================================= */

function KolomInput({
  label,
  name,
  value,
  placeholder,
  garisBawah,
  onChange,
}: {
  label: string;
  name: keyof FormProfil;
  value: string;
  placeholder: string;
  garisBawah?: boolean;
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

      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        type="text"
        placeholder={placeholder}
        className={`h-14 w-full rounded-lg border border-gray-200 bg-white px-4 text-base text-black shadow-sm outline-none transition duration-200 placeholder:text-gray-400 focus:border-red-300 focus:ring-2 focus:ring-red-100 ${
          garisBawah
            ? "placeholder:underline"
            : ""
        }`}
      />
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function EditProfilePage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState<FormProfil>(INITIAL_FORM);

  const [namaAsli, setNamaAsli] =
    useState("");

  /* =======================================================
     FOTO
  ======================================================= */

  const [foto, setFoto] =
    useState<File | null>(null);

  const [previewFoto, setPreviewFoto] =
    useState<string>(
      fotoProfilAdmin(null)
    );

  /* =======================================================
     STATUS
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
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

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Gagal mengambil profil"
          );
        }

        setForm({
          nama_admin:
            result.data.nama_admin ?? "",
          email: result.data.email ?? "",
          no_hp: result.data.no_hp ?? "",
          alamat:
            result.data.alamat ?? "",
        });

        setNamaAsli(
          result.data.nama_admin ?? ""
        );

        setPreviewFoto(
          fotoProfilAdmin(
            result.data.foto_profil
          )
        );
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan"
        );
      } finally {
        setLoading(false);
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
     PILIH FOTO
  ======================================================= */

  function pilihFoto(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Ukuran foto maksimal 5 MB"
      );

      return;
    }

    setError("");

    setFoto(file);

    setPreviewFoto(
      URL.createObjectURL(file)
    );
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  function bukaKonfirmasi(
    e: FormEvent
  ) {
    e.preventDefault();

    setError("");

    setKonfirmasiSimpan(true);
  }

  async function simpanProfil() {
    try {
      setSaving(true);

      setKonfirmasiSimpan(false);

      const formData = new FormData();

      formData.append(
        "nama_admin",
        form.nama_admin
      );

      formData.append(
        "email",
        form.email
      );

      formData.append(
        "no_hp",
        form.no_hp
      );

      formData.append(
        "alamat",
        form.alamat
      );

      if (foto) {
        formData.append("foto", foto);
      }

      const response = await fetch(
        "/api/web/auth/dashboard/profile",
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal menyimpan profil"
        );
      }

      setSukses(true);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan profil"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />

          <p className="mt-3 text-sm text-gray-400">
            Memuat Profil...
          </p>
        </div>
      </div>
    );
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
        Edit Profile
      </h1>

      <p className="mt-2 text-xl font-bold text-black">
        Foto Profile
      </p>

      {/* ===================================================
          FOTO
      =================================================== */}

      <div className="mt-3 flex items-start gap-8">
        <span className="relative h-[190px] w-[190px] shrink-0 overflow-hidden bg-gray-100 shadow-md">
          <Image
            src={previewFoto}
            alt={namaAsli || "Foto profil"}
            fill
            sizes="190px"
            unoptimized={previewFoto.startsWith(
              "blob:"
            )}
            className="object-cover"
          />
        </span>

        <div className="mt-4">
          <p className="text-2xl font-bold text-black">
            {namaAsli}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={pilihFoto}
            className="hidden"
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="mt-4 flex h-12 w-[210px] items-center justify-center rounded-lg border border-[#EC2727] bg-white text-base font-bold text-[#EC2727] shadow-sm transition-colors duration-200 hover:bg-red-50"
          >
            Ubah Foto
          </button>
        </div>
      </div>

      {/* ===================================================
          FORM
      =================================================== */}

      <form
        onSubmit={bukaKonfirmasi}
        className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >

        <KolomInput
          label="Nama Lengkap"
          name="nama_admin"
          value={form.nama_admin}
          placeholder="Masukan Nama Lengkap"
          onChange={ubahForm}
        />

        <KolomInput
          label="Email"
          name="email"
          value={form.email}
          placeholder="Masukan Email"
          garisBawah
          onChange={ubahForm}
        />

        <KolomInput
          label="No. Telepon"
          name="no_hp"
          value={form.no_hp}
          placeholder="Masukan No. Telepon"
          onChange={ubahForm}
        />

        <KolomInput
          label="Alamat"
          name="alamat"
          value={form.alamat}
          placeholder="Masukan Alamat"
          onChange={ubahForm}
        />

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <p className="mt-2 text-sm font-medium text-[#EC2727]">
            {error}
          </p>
        )}

        {/* =================================================
            TOMBOL
        ================================================= */}

        <div className="mt-10 flex justify-end gap-4">

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
          KONFIRMASI SIMPAN
      =================================================== */}

      <AskModal
        isOpen={konfirmasiSimpan}
        variant="tanya"
        title="Konfirmasi Ubah"
        description="Apakah anda yakin ingin mengubah data profile saat ini?"
        buttonLabel="Ubah"
        cancelLabel="Batal"
        onConfirm={simpanProfil}
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
        title="Data Profile Berhasil Diganti"
        description="Anda telah berhasil mengganti data profile baru. Silahkan coba buka kembali"
        buttonLabel="Kembali"
        onClose={() => {
          setSukses(false);

          router.push(
            "/dashboard/profile"
          );

          router.refresh();
        }}
      />
    </div>
  );
}
