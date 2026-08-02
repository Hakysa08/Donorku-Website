"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";

import AskModal from "@/components/AskModal";
import SuccessModal from "@/components/SuccessModal";

/* =========================================================
   TYPE
========================================================= */

type AturanTips = {
  id_tips: number;
  judul: string;
  kategori: string;
  status: "publish" | "draft";
  isi: string;
  tanggal_dibuat: string;
  tanggal_diubah: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AturanTipsResponse = {
  message: string;

  data: AturanTips[];

  pagination: Pagination;
};

/* =========================================================
   FORMAT TANGGAL

   Mengikuti design Figma:
   2021 - 10 - 27
========================================================= */

function formatTanggal(
  tanggal: string | null
): string {
  if (!tanggal) {
    return "-";
  }

  const waktu = new Date(tanggal);

  if (Number.isNaN(waktu.getTime())) {
    return "-";
  }

  const tahun = waktu.getFullYear();

  const bulan = String(
    waktu.getMonth() + 1
  ).padStart(2, "0");

  const hari = String(
    waktu.getDate()
  ).padStart(2, "0");

  return `${tahun} - ${bulan} - ${hari}`;
}

/* =========================================================
   BADGE STATUS

   publish -> Aktif
   draft   -> Nonaktif
========================================================= */

function BadgeStatus({
  status,
}: {
  status: "publish" | "draft";
}) {
  const aktif = status === "publish";

  return (
    <span
      className={`inline-flex h-8 w-[104px] items-center justify-center rounded-full text-sm font-medium ${
        aktif
          ? "bg-[#68FF5B] text-black"
          : "bg-gray-200 text-gray-600"
      }`}
    >
      {aktif ? "Aktif" : "Nonaktif"}
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AturanTipsPage() {
  const router = useRouter();

  const [aturanTips, setAturanTips] =
    useState<AturanTips[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     PAGINATION
  ======================================================= */

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 8,
      total: 0,
      totalPages: 1,
    });

  /* =======================================================
     DELETE
  ======================================================= */

  const [deleteId, setDeleteId] =
    useState<number | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  const [suksesHapus, setSuksesHapus] =
    useState(false);

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const ambilAturanTips =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const params =
          new URLSearchParams();

        params.set(
          "page",
          page.toString()
        );

        params.set("limit", "8");

        const response =
          await fetch(
            `/api/web/auth/dashboard/aturantips?${params.toString()}`,
            {
              method: "GET",
              cache: "no-store",
              credentials:
                "include",
            }
          );

        const contentType =
          response.headers.get(
            "content-type"
          );

        if (
          !contentType?.includes(
            "application/json"
          )
        ) {
          throw new Error(
            `API tidak mengembalikan JSON (${response.status})`
          );
        }

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Gagal mengambil aturan dan tips"
          );
        }

        const data =
          result as AturanTipsResponse;

        setAturanTips(data.data);

        setPagination(
          data.pagination
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
    }, [page]);

  useEffect(() => {
    ambilAturanTips();
  }, [ambilAturanTips]);

  /* =======================================================
     DELETE
  ======================================================= */

  async function hapusAturanTips() {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);

      const response =
        await fetch(
          `/api/web/auth/dashboard/aturantips/${deleteId}`,
          {
            method: "DELETE",
            credentials:
              "include",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal menghapus aturan/tips"
        );
      }

      setDeleteId(null);

      setSuksesHapus(true);

      /*
       * Kalau item terakhir pada halaman dihapus,
       * mundur satu halaman.
       */

      if (
        aturanTips.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            current - 1
        );
      } else {
        await ambilAturanTips();
      }
    } catch (err) {
      setDeleteId(null);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus aturan/tips"
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =======================================================
     PAGE NUMBER
  ======================================================= */

  const halaman =
    buatNomorHalaman(
      pagination.page,
      pagination.totalPages
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
  <div className="min-h-full bg-white px-10 py-7">

    {/* ===================================================
        HEADER
    =================================================== */}

    <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

      <h1 className="text-[36px] font-bold tracking-tight text-black">
        Aturan &amp; Tips
      </h1>

      <Link
        href="/dashboard/aturantips/tambah"
        className="flex h-[52px] items-center justify-center rounded-lg bg-[#EC2727] px-7 text-sm font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#d31f1f]"
      >
        Tambah Aturan /Tips Baru
      </Link>
    </div>

      {/* ===================================================
          TABLE CONTAINER
      =================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">

            <thead>
              <tr className="border-b border-gray-400 text-black">
                <th className="px-6 py-5 text-base font-bold">
                  Judul
                </th>

                <th className="px-6 py-5 text-center text-base font-bold">
                  Kategori
                </th>

                <th className="px-6 py-5 text-center text-base font-bold">
                  Status
                </th>

                <th className="px-6 py-5 text-center text-base font-bold">
                  Tgl Dibuat
                </th>

                <th className="px-6 py-5 text-center text-base font-bold">
                  Tgl Modifikasi
                </th>

                <th className="px-6 py-5 text-center text-base font-bold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-sm text-gray-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : aturanTips.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-16 text-center text-sm text-gray-400"
                  >
                    Data aturan dan tips tidak ditemukan
                  </td>
                </tr>
              ) : (
                aturanTips.map((item) => (
                  <tr
                    key={item.id_tips}
                    className="border-b border-gray-300 text-black transition-colors duration-200 last:border-b-0 hover:bg-gray-50"
                  >

                    {/* JUDUL */}
                    <td className="max-w-[320px] px-6 py-4 text-base">
                      {item.judul}
                    </td>

                    {/* KATEGORI */}
                    <td className="whitespace-nowrap px-6 py-4 text-center text-base">
                      {item.kategori}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 text-center">
                      <BadgeStatus
                        status={item.status}
                      />
                    </td>

                    {/* TANGGAL DIBUAT */}
                    <td className="whitespace-nowrap px-6 py-4 text-center text-base">
                      {formatTanggal(
                        item.tanggal_dibuat
                      )}
                    </td>

                    {/* TANGGAL DIUBAH */}
                    <td className="whitespace-nowrap px-6 py-4 text-center text-base">
                      {formatTanggal(
                        item.tanggal_diubah ??
                          item.tanggal_dibuat
                      )}
                    </td>

                    {/* AKSI */}
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">

                        {/* EDIT */}
                        <button
                          type="button"
                          title="Edit Aturan/Tips"
                          onClick={() =>
                            router.push(
                              `/dashboard/aturantips/${item.id_tips}/edit`
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors duration-200 hover:bg-gray-100"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          title="Hapus Aturan/Tips"
                          onClick={() =>
                            setDeleteId(
                              item.id_tips
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#EC2727] transition-colors duration-200 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <p className="mt-4 text-sm font-medium text-[#EC2727]">
          {error}
        </p>
      )}

      {/* ===================================================
          PAGINATION
      =================================================== */}

      {!loading &&
        !error &&
        pagination.total > 0 && (
          <div className="mt-5 flex justify-end">

            <div className="flex items-center gap-2">

              {/* PREVIOUS */}

              <button
                type="button"
                disabled={page === 1}
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* NUMBER */}

              {halaman.map(
                (item, index) =>
                  item === "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex h-8 min-w-8 items-center justify-center text-xs"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setPage(
                          Number(item)
                        )
                      }
                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs shadow-sm transition duration-200 ${
                        page === item
                          ? "border-[#EC2727] bg-[#EC2727] text-white"
                          : "border-gray-200 bg-white text-black hover:bg-gray-50"
                      }`}
                    >
                      {item}
                    </button>
                  )
              )}

              {/* NEXT */}

              <button
                type="button"
                disabled={
                  page >=
                  pagination.totalPages
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.min(
                        pagination.totalPages,
                        current + 1
                      )
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>
          </div>
        )}

      {/* ===================================================
          KONFIRMASI HAPUS
      =================================================== */}

      <AskModal
        isOpen={deleteId !== null}
        variant="tanya"
        title="Konfirmasi Hapus"
        description="Apakah anda yakin ingin menghapus Aturan/Tips ini? Tindakan ini tidak dapat dibatalkan"
        buttonLabel={
          deleting
            ? "Menghapus..."
            : "Hapus"
        }
        cancelLabel="Batal"
        onConfirm={hapusAturanTips}
        onClose={() =>
          setDeleteId(null)
        }
      />

      {/* ===================================================
          BERHASIL DIHAPUS
      =================================================== */}

      <SuccessModal
        isOpen={suksesHapus}
        variant="success"
        title="Aturan/Tips Berhasil Dihapus"
        description="Anda telah berhasil menghapus Aturan/Tips. Terima kasih telah menggunakan aplikasi ini."
        buttonLabel="Kembali"
        onClose={() =>
          setSuksesHapus(false)
        }
      />
    </div>
  );
}

/* =========================================================
   PAGINATION HELPER

   Contoh:

   1 2 3 ... 20

   atau

   1 ... 8 9 10 ... 20
========================================================= */

function buatNomorHalaman(
  current: number,
  total: number
): (number | "...")[] {

  if (total <= 5) {
    return Array.from(
      { length: total },
      (_, index) =>
        index + 1
    );
  }

  if (current <= 3) {
    return [
      1,
      2,
      3,
      "...",
      total,
    ];
  }

  if (current >= total - 2) {
    return [
      1,
      "...",
      total - 2,
      total - 1,
      total,
    ];
  }

  return [
    1,
    "...",
    current - 1,
    current,
    current + 1,
    "...",
    total,
  ];
}
