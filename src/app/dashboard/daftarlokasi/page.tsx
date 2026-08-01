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
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

/* =========================================================
   TYPE
========================================================= */

type Lokasi = {
  id_lokasi: number;
  nama_lokasi: string;
  alamat: string;
  kota: string;
  no_hp: string;
  longitude: number | string;
  latitude: number | string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type LokasiResponse = {
  message: string;

  data: Lokasi[];

  pagination: Pagination;
};

/* =========================================================
   PAGE
========================================================= */

export default function DaftarLokasiPage() {
  const router = useRouter();

  const [lokasi, setLokasi] =
    useState<Lokasi[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     SEARCH
  ======================================================= */

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  /* =======================================================
     TANGGAL
  ======================================================= */

  const [tanggal, setTanggal] =
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

  /* =======================================================
     FETCH DATA
  ======================================================= */

  const ambilLokasi =
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

        if (search) {
          params.set(
            "search",
            search
          );
        }

        if (tanggal) {
          params.set(
            "tanggal",
            tanggal
          );
        }

        const response =
          await fetch(
            `/api/web/auth/dashboard/daftarlokasi?${params.toString()}`,
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
              "Gagal mengambil lokasi"
          );
        }

        const data =
          result as LokasiResponse;

        setLokasi(data.data);

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
    }, [page, search, tanggal]);

  useEffect(() => {
    ambilLokasi();
  }, [ambilLokasi]);

  /* =======================================================
     SEARCH DEBOUNCE

     Tidak request setiap karakter secara langsung.
  ======================================================= */

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        setPage(1);

        setSearch(
          searchInput.trim()
        );
      }, 400);

    return () =>
      clearTimeout(timeout);
  }, [searchInput]);

  /* =======================================================
     DELETE
  ======================================================= */

  async function hapusLokasi() {
    if (!deleteId) {
      return;
    }

    try {
      setDeleting(true);

      const response =
        await fetch(
          `/api/web/auth/dashboard/daftarlokasi/${deleteId}`,
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
            "Gagal menghapus lokasi"
        );
      }

      setDeleteId(null);

      /*
       * Kalau item terakhir pada halaman dihapus,
       * mundur satu halaman.
       */

      if (
        lokasi.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            current - 1
        );
      } else {
        await ambilLokasi();
      }
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Gagal menghapus lokasi"
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
    <div className="w-full px-2 pb-10 pt-6">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        <h1 className="text-[36px] font-bold tracking-tight text-black">
          Daftar Lokasi
        </h1>

        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH */}

          <div className="relative w-full sm:w-[295px]">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />

            <input
              value={searchInput}
              onChange={(e) =>
                setSearchInput(
                  e.target.value
                )
              }
              type="text"
              placeholder="Cari Disini"
              className="h-[52px] w-full rounded-2xl border border-gray-200 text-gray bg-white pl-13 pr-12 text-sm text-black outline-none shadow-sm transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* DATE PICKER */}

          <div className="relative">
            <input
              type="date"
              value={tanggal}
              onChange={(e) => {
                setTanggal(
                  e.target.value
                );

                setPage(1);
              }}
              className="h-[52px] w-[200px] cursor-pointer rounded-2xl border border-gray-200 bg-white px-4 text-sm text-black outline-none shadow-sm transition focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />

            {tanggal && (
              <button
                type="button"
                title="Hapus filter tanggal"
                onClick={() => {
                  setTanggal("");
                  setPage(1);
                }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* TAMBAH */}

          <Link
            href="/dashboard/daftarlokasi/tambah"
            className="flex h-[52px] items-center gap-6 rounded-2xl bg-red-500 px-6 text-sm font-medium text-white shadow-sm transition hover:bg-red-600"
          >
            Tambah Lokasi

            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* ===================================================
          TABLE CONTAINER
      =================================================== */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-left">

      <thead>
        <tr className="border-b border-gray-400 text-black">
          <th className="px-5 py-5 text-xs font-bold">
            ID
          </th>

          <th className="px-5 py-5 text-xs font-bold">
            Lokasi Donor
          </th>

          <th className="px-5 py-5 text-xs font-bold">
            Alamat Lokasi
          </th>

          <th className="px-5 py-5 text-xs font-bold">
            Kota
          </th>

          <th className="px-5 py-5 text-xs font-bold">
            No Petugas
          </th>

          <th className="px-5 py-5 text-xs font-bold">
            Longitude
          </th>

          <th className="px-5 py-5 text-xs font-bold">
            Latitude
          </th>

          <th className="px-5 py-5 text-center text-xs font-bold">
            Action
          </th>
        </tr>
      </thead>

      <tbody>
        {lokasi.length === 0 ? (
          <tr>
            <td
              colSpan={8}
              className="px-5 py-16 text-center text-sm text-gray-400"
            >
              Data lokasi tidak ditemukan
            </td>
          </tr>
        ) : (
          lokasi.map((item) => (
            <tr
              key={item.id_lokasi}
              className="border-b border-gray-300 text-black transition last:border-b-0 hover:bg-gray-50"
            >

              {/* ID */}
              <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-black">
                {item.id_lokasi}
              </td>

              {/* LOKASI */}
              <td className="whitespace-nowrap px-5 py-4 text-xs font-medium text-black">
                {item.nama_lokasi}
              </td>

              {/* ALAMAT */}
              <td className="max-w-[250px] px-5 py-4 text-xs text-black">
                <div
                  className="truncate"
                  title={item.alamat}
                >
                  {item.alamat}
                </div>
              </td>

              {/* KOTA */}
              <td className="whitespace-nowrap px-5 py-4 text-xs text-black">
                {item.kota}
              </td>

              {/* NO PETUGAS */}
              <td className="whitespace-nowrap px-5 py-4 text-xs text-black">
                {item.no_hp}
              </td>

              {/* LONGITUDE */}
              <td className="whitespace-nowrap px-5 py-4 text-xs text-black">
                {item.longitude}
              </td>

              {/* LATITUDE */}
              <td className="whitespace-nowrap px-5 py-4 text-xs text-black">
                {item.latitude}
              </td>

              {/* ACTION */}
              <td className="px-5 py-3">
                <div className="flex items-center justify-center gap-2">

                    {/* 👁️ DETAIL / PREVIEW */}
                    <button
                      type="button"
                      title="Detail Lokasi"
                      onClick={() =>
                        router.push(
                          `/dashboard/daftarlokasi/${item.id_lokasi}`
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                    >
                      <Eye size={16} />
                    </button>

                    {/* ✏️ EDIT */}
                    <button
                      type="button"
                      title="Edit Lokasi"
                      onClick={() =>
                        router.push(
                          `/dashboard/daftarlokasi/${item.id_lokasi}/edit`
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                    >
                      <Pencil size={16} />
                    </button>

                    {/* 🗑️ DELETE */}
                    <button
                      type="button"
                      title="Hapus Lokasi"
                      onClick={() =>
                        setDeleteId(item.id_lokasi)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600"
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
                disabled={
                  page === 1
                }
                onClick={() =>
                  setPage(
                    (current) =>
                      Math.max(
                        1,
                        current - 1
                      )
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* NUMBER */}

              {halaman.map(
                (
                  item,
                  index
                ) =>
                  item ===
                  "..." ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="flex h-8 min-w-8 items-center justify-center text-xs"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={
                        item
                      }
                      type="button"
                      onClick={() =>
                        setPage(
                          Number(
                            item
                          )
                        )
                      }
                      className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs shadow-sm transition ${
                        page ===
                        item
                          ? "border-red-500 bg-red-500 text-white"
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
                        current +
                          1
                      )
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>
          </div>
        )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">

          <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-xl">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <img src="/popup-card/tanya.png" alt="" className="h-6 w-6 text-red-500"/>
            </div>

            <h2 className="mt-4 text-center text-black font-bold">
              Konfirmasi Hapus
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-gray-500">
              Apakah Anda yakin ingin Menghapus Data?
            </p>

            <div className="mt-6 flex gap-3">

              <button
                type="button"
                disabled={deleting}
                onClick={
                  hapusLokasi
                }
                className="h-11 flex-1 rounded-xl bg-red-500 font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting
                  ? "Menghapus..."
                  : "Hapus"}
              </button>
              
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteId(
                    null
                  )
                }
                className="h-11 flex-1 rounded-xl border border-gray-200 font-medium transition text-black hover:bg-gray-50"
              >
                Batal
              </button>

            </div>
          </div>
        </div>
      )}
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