"use client";

import {
  use,
  useEffect,
  useState,
} from "react";

import FormAturanTips, {
  FormAturanTipsData,
} from "@/components/FormAturanTips";

/* =========================================================
   PAGE
========================================================= */

export default function EditAturanTipsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [nilaiAwal, setNilaiAwal] =
    useState<FormAturanTipsData | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     AMBIL DATA
  ======================================================= */

  useEffect(() => {
    async function ambilAturanTips() {
      try {
        const response = await fetch(
          `/api/web/auth/dashboard/aturantips/${id}`,
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
              "Gagal mengambil aturan/tips"
          );
        }

        setNilaiAwal({
          judul: result.data.judul ?? "",

          kategori:
            result.data.kategori ??
            "Aturan",

          /*
           * Enum database publish/draft
           * ditampilkan sebagai Aktif/Nonaktif.
           */
          status:
            result.data.status ===
            "publish"
              ? "Aktif"
              : "Nonaktif",

          isi: result.data.isi ?? "",
        });
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

    ambilAturanTips();
  }, [id]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />

          <p className="mt-3 text-sm text-gray-400">
            Memuat Aturan/Tips...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !nilaiAwal) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-5 text-center">
          <p className="font-semibold text-red-500">
            Aturan/Tips gagal dimuat
          </p>

          <p className="mt-1 text-xs text-red-400">
            {error ||
              "Data aturan/tips tidak ditemukan"}
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <FormAturanTips
      judulHalaman="Edit Aturan & Tips Baru"
      placeholderJudul="Masukan Judul Baru Aturan/Tips disini...."
      nilaiAwal={nilaiAwal}
      endpoint={`/api/web/auth/dashboard/aturantips/${id}`}
      method="PUT"
      judulSukses="Aturan/Tips Berhasil Diubah"
      deskripsiSukses="Anda telah berhasil mengubah Aturan/Tips. Silahkan coba buka kembali"
    />
  );
}
