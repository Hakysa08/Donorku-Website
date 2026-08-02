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

import AskModal from "@/components/AskModal";

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

        params.set("limit", "10");

        if (search) {
          params.set(
            "search",
            search
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
    }, [page, search]);

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
    <div className="min-h-full bg-white px-10 py-7">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

        <h1 className="text-[36px] font-bold tracking-tight text-black">
          Daftar Lokasi
        </h1>

        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH */}

          <div className="flex h-[52px] w-[295px] items-center rounded-2xl border border-gray-200 bg-white px-5 shadow-sm text-black">
            <Search
              size={22}
              strokeWidth={2}
              className="shrink-0"
            />

            <input
              value={searchInput}
              onChange={(e) =>
                setSearchInput(
                  e.target.value
                )
              }
              type="text"
              placeholder="Cari Disini"
              className="ml-3 min-w-0 flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder:text-gray-400"
            />

            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="ml-2"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* TAMBAH */}

          <Link
            href="/dashboard/daftarlokasi/tambah"
            className="flex h-[52px] items-center gap-5 rounded-2xl bg-red-600 px-6 text-[13px] font-medium text-white shadow-sm transition hover:bg-red-500"
          >
            Tambah Lokasi

            <Plus
              size={22}
              strokeWidth={2}
            />
          </Link>
        </div>
      </div>

      {/* ===================================================
          TABLE CONTAINER
      =================================================== */}

      <div className=" overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] border-collapse text-left text-[13px] text-black">

            <thead>
              <tr className="border-b border-black-400 text-black">

                <th className="px-6 py-5 text-[14px] font-bold">
                  ID
                </th>

                <th className="px-6 py-5 text-[14px] font-bold">
                  Lokasi Donor
                </th>

                <th className="px-6 py-5 text-[14px] font-bold">
                  Alamat Lokasi
                </th>

                <th className="px-6 py-5 text-[14px] font-bold">
                  Kota
                </th>

                <th className="px-6 py-5 text-[14px] font-bold">
                  No Petugas
                </th>

                <th className="px-6 py-5 text-[14px] font-bold">
                  Longitude
                </th>

                <th className="px-6 py-5 text-[14px] font-bold">
                  Latitude
                </th>

                <th className="px-6 py-5 text-[14px] font-bold">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>

              {/* LOADING */}

              {loading &&
                Array.from({
                  length: 8,
                }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-300"
                  >
                    <td
                      colSpan={8}
                      className="h-[49px] px-6"
                    >
                      <div className="h-3 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))}

              {/* EMPTY */}

              {!loading &&
                lokasi.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center text-gray-400"
                    >
                      Data lokasi tidak ditemukan.
                    </td>
                  </tr>
                )}

              {/* DATA */}

              {!loading &&
                lokasi.map((item) => (
                  <tr
                    key={item.id_lokasi}
                    className="border-b border-black-300 last:border-b-0"
                  >

                    <td className="px-6 py-5 text-[14px]">
                      {item.id_lokasi}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.nama_lokasi}
                    </td>

                    <td className="max-w-[230px] px-4 py-3">
                      <div className="truncate">
                        {item.alamat}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.kota}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.no_hp}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.longitude}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.latitude}
                    </td>

                    {/* ACTION */}

                    <td className="px-4 py-3">

                      <div className="flex justify-center gap-2">

                        {/* DETAIL */}

                        <button
                          type="button"
                          title="Lihat Detail"
                          onClick={() =>
                            router.push(
                              `/dashboard/daftarlokasi/${item.id_lokasi}`
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100"
                        >
                          <Eye
                            size={17}
                            strokeWidth={2}
                          />
                        </button>

                        {/* EDIT */}

                        <button
                          type="button"
                          title="Edit"
                          onClick={() =>
                            router.push(
                              `/dashboard/daftarlokasi/${item.id_lokasi}/edit`
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100"
                        >
                          <Pencil
                            size={16}
                            strokeWidth={2}
                          />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          title="Hapus"
                          onClick={() =>
                            setDeleteId(item.id_lokasi)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition hover:bg-red-500"
                        >
                          <Trash2
                            size={16}
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
          <div className="mt-5 flex justify-end gap-2">

            {/* PREVIOUS */}

            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((prev) =>
                  Math.max(1, prev - 1)
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 text-black"
            >
              <ChevronLeft size={17} />
            </button>

            {/* PAGES */}

            {halaman.map(
              (pageItem, index) => {
                if (pageItem === "...") {
                  return (
                    <div
                      key={`ellipsis-${index}`}
                      className="flex h-8 min-w-8 items-center justify-center px-1 text-sm"
                    >
                      ...
                    </div>
                  );
                }

                const active = pageItem === page;

                return (
                  <button
                    key={pageItem}
                    type="button"
                    onClick={() => setPage(pageItem)}
                    className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm shadow-sm transition ${
                      active
                        ? "bg-red-600 text-white"
                        : "border border-gray-200 bg-white hover:bg-gray-100 text-black"
                    }`}
                  >
                    {pageItem}
                  </button>
                );
              }
            )}

            {/* NEXT */}

            <button
              type="button"
              disabled={
                page >= pagination.totalPages
              }
              onClick={() =>
                setPage((prev) =>
                  Math.min(
                    pagination.totalPages,
                    prev + 1
                  )
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 text-black"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        )}

      {/* ===================================================
          DELETE MODAL
      =================================================== */}

      <AskModal
        isOpen={deleteId !== null}
        variant="tanya"
        title="Konfirmasi Hapus"
        description="Apakah anda yakin ingin mengahapus data?"
        buttonLabel={deleting ? "Menghapus..." : "Hapus"}
        cancelLabel="Batal"
        onClose={() => setDeleteId(null)}
        onConfirm={hapusLokasi}
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