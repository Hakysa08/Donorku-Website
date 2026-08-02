"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import AskModal from "@/components/AskModal";
import SuccessModal from "@/components/SuccessModal";

/* =========================================================
   TYPE
========================================================= */

export type FormAturanTipsData = {
  judul: string;
  kategori: string;
  status: string;
  isi: string;
};

export const INITIAL_FORM_ATURAN_TIPS: FormAturanTipsData =
  {
    judul: "",
    kategori: "Aturan",
    status: "Aktif",
    isi: "",
  };

const KATEGORI = ["Aturan", "Tips"];

const STATUS = ["Aktif", "Nonaktif"];

/* =========================================================
   FORM ATURAN DAN TIPS

   Dipakai bersama oleh halaman:
   - /dashboard/aturantips/tambah
   - /dashboard/aturantips/[id]/edit
========================================================= */

export default function FormAturanTips({
  judulHalaman,
  placeholderJudul,
  nilaiAwal,
  endpoint,
  method,
  judulSukses,
  deskripsiSukses,
}: {
  judulHalaman: string;
  placeholderJudul: string;
  nilaiAwal: FormAturanTipsData;
  endpoint: string;
  method: "POST" | "PUT";
  judulSukses: string;
  deskripsiSukses: string;
}) {
  const router = useRouter();

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState<FormAturanTipsData>(
      nilaiAwal
    );

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
     UBAH FORM
  ======================================================= */

  function ubahForm(
    e: ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >
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

    setError("");

    if (
      !form.judul.trim() ||
      !form.isi.trim()
    ) {
      setError(
        "Judul dan isi/deskripsi wajib diisi"
      );

      return;
    }

    setKonfirmasiSimpan(true);
  }

  async function simpan() {
    try {
      setSaving(true);

      setKonfirmasiSimpan(false);

      const response = await fetch(
        endpoint,
        {
          method,
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
        throw new Error(
          result.message ||
            "Gagal menyimpan aturan/tips"
        );
      }

      setSukses(true);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan aturan/tips"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7">

      <h1 className="text-[36px] font-bold tracking-tight text-black">
        {judulHalaman}
      </h1>

      <form
        onSubmit={bukaKonfirmasi}
        className="mt-8"
      >

        {/* =================================================
            JUDUL
        ================================================= */}

        <label
          htmlFor="judul"
          className="mb-2 block text-xl font-bold text-black"
        >
          Judul
        </label>

        <input
          id="judul"
          name="judul"
          value={form.judul}
          onChange={ubahForm}
          type="text"
          placeholder={placeholderJudul}
          className="h-16 w-full rounded-xl border border-gray-200 bg-white px-5 text-lg text-black shadow-sm outline-none transition duration-200 placeholder:text-gray-400 focus:border-red-300 focus:ring-2 focus:ring-red-100"
        />

        {/* =================================================
            KATEGORI DAN STATUS
        ================================================= */}

        <div className="mt-6 flex flex-wrap gap-6">

          {/* KATEGORI */}

          <div>
            <label
              htmlFor="kategori"
              className="mb-2 block text-xl font-bold text-black"
            >
              Kategori
            </label>

            <select
              id="kategori"
              name="kategori"
              value={form.kategori}
              onChange={ubahForm}
              className="h-14 w-[230px] cursor-pointer rounded-lg border border-gray-200 bg-white px-4 text-lg text-black shadow-sm outline-none transition duration-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              {KATEGORI.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>

          {/* STATUS */}

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-xl font-bold text-black"
            >
              Status
            </label>

            <select
              id="status"
              name="status"
              value={form.status}
              onChange={ubahForm}
              className="h-14 w-[230px] cursor-pointer rounded-lg border border-gray-200 bg-white px-4 text-lg text-black shadow-sm outline-none transition duration-200 focus:border-red-300 focus:ring-2 focus:ring-red-100"
            >
              {STATUS.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* =================================================
            ISI / DESKRIPSI
        ================================================= */}

        <label
          htmlFor="isi"
          className="mb-2 mt-10 block text-xl font-bold text-black"
        >
          Isi/Deskripsi
        </label>

        <textarea
          id="isi"
          name="isi"
          value={form.isi}
          onChange={ubahForm}
          placeholder="Masukan Isi/Deskripsi disini...."
          className="h-[190px] w-full resize-none rounded-xl border border-gray-200 bg-white p-5 text-lg text-black shadow-sm outline-none transition duration-200 placeholder:text-gray-400 focus:border-red-300 focus:ring-2 focus:ring-red-100"
        />

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <p className="mt-3 text-sm font-medium text-[#EC2727]">
            {error}
          </p>
        )}

        {/* =================================================
            TOMBOL
        ================================================= */}

        <div className="mt-6 flex gap-4">

          <button
            type="submit"
            disabled={saving}
            className="flex h-12 w-[210px] items-center justify-center rounded-lg bg-[#EC2727] text-base font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#d31f1f] disabled:opacity-50"
          >
            {saving
              ? "Menyimpan..."
              : "Simpan Perubahan"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              setKonfirmasiBatal(true)
            }
            className="flex h-12 w-[210px] items-center justify-center rounded-lg bg-[#9CA3AF] text-base font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#8b929c] disabled:opacity-50"
          >
            Batal
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
        description="Apakah anda yakin ingin mengubah Aturan/Tips saat ini?"
        buttonLabel="Ubah"
        cancelLabel="Batal"
        onConfirm={simpan}
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
            "/dashboard/aturantips"
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
        title={judulSukses}
        description={deskripsiSukses}
        buttonLabel="Kembali"
        onClose={() => {
          setSukses(false);

          router.push(
            "/dashboard/aturantips"
          );

          router.refresh();
        }}
      />
    </div>
  );
}
