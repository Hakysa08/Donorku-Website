"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";
import AskModal from "@/components/AskModal";

/* =========================================================
   TYPE
========================================================= */

type Lokasi = {
  id_lokasi: number;
  nama_lokasi: string;
  alamat: string;
  kota: string;
};

type Jadwal = {
  id_jadwal: number;

  tanggal_pelaksanaan: string | null;

  jam_mulai: string | null;
  jam_selesai: string | null;

  kuota: number;
  status_jadwal: string;

  total_pendaftar_online: number;
  total_pendonor_offline: number;
  pendonor_hadir: number;
  darah_terkumpul: number;

  nama_penanggung_jawab: string | null;
  kontak_penanggung_jawab: string | null;

  foto_lokasi: string | null;

  penyelenggara: string;

  lokasi: Lokasi;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiResponse = {
  message: string;
  data: Jadwal[];
  pagination: Pagination;
};

/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatTanggal(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/* =========================================================
   PAGE
========================================================= */

export default function JadwalDonorPage() {
  const router = useRouter();

  const [jadwal, setJadwal] = useState<Jadwal[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] = useState("");

  const [tanggal, setTanggal] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: 8,
      total: 0,
      totalPages: 1,
    });

  /* =======================================================
     MODAL STATE
  ======================================================= */

  // id jadwal yang lagi diminta konfirmasi hapusnya (null = modal tertutup)
  const [konfirmasiHapusId, setKonfirmasiHapusId] =
    useState<number | null>(null);

  const [menghapus, setMenghapus] = useState(false);

  // pesan error yang mau ditampilkan lewat modal (null = modal tertutup)
  const [modalError, setModalError] = useState<string | null>(null);

  /* =======================================================
     SEARCH DEBOUNCE
  ======================================================= */

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  /* =======================================================
     FETCH
  ======================================================= */

  const ambilJadwal = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", "8");

      if (search) {
        params.set("search", search);
      }

      if (tanggal) {
        params.set("tanggal", tanggal);
      }

      const response = await fetch(
        `/api/web/auth/dashboard/jadwaldonor?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal mengambil data jadwal"
        );
      }

      const data = result as ApiResponse;

      setJadwal(data.data ?? []);

      setPagination(
        data.pagination ?? {
          page: 1,
          limit: 8,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error(error);

      setJadwal([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, tanggal]);

  useEffect(() => {
    ambilJadwal();
  }, [ambilJadwal]);

  /* =======================================================
     DELETE (via modal, bukan window.confirm/alert lagi)
  ======================================================= */

  function mintaKonfirmasiHapus(id: number) {
    setKonfirmasiHapusId(id);
  }

  async function konfirmasiHapus() {
    if (konfirmasiHapusId === null) return;

    const id = konfirmasiHapusId;

    try {
      setMenghapus(true);

      const response = await fetch(
        `/api/web/auth/dashboard/jadwaldonor?id=${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Gagal menghapus jadwal"
        );
      }

      setKonfirmasiHapusId(null);

      if (jadwal.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
        return;
      }

      await ambilJadwal();
    } catch (error) {
      console.error(error);

      setKonfirmasiHapusId(null);
      setModalError(
        error instanceof Error
          ? error.message
          : "Gagal menghapus jadwal"
      );
    } finally {
      setMenghapus(false);
    }
  }

  /* =======================================================
     PAGINATION
  ======================================================= */

  function getPages() {
    const total = pagination.totalPages;

    if (total <= 5) {
      return Array.from(
        { length: total },
        (_, i) => i + 1
      );
    }

    const pages: (number | "...")[] = [];

    if (page <= 3) {
      pages.push(1, 2, 3, "...", total);
    } else if (page >= total - 2) {
      pages.push(
        1,
        "...",
        total - 2,
        total - 1,
        total
      );
    } else {
      pages.push(
        1,
        "...",
        page,
        "...",
        total
      );
    }

    return pages;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">

      {/* ================= HEADER ================= */}

      <div className="mb-8 flex items-center justify-between gap-6">

        <h1 className="text-[36px] font-bold tracking-tight">
          Jadwal Donor
        </h1>

        <div className="flex items-center gap-3">

          {/* SEARCH */}

          <div className="flex h-[52px] w-[295px] items-center rounded-2xl border border-gray-200 bg-white px-5 shadow-sm">
            <Search
              size={22}
              strokeWidth={2}
              className="shrink-0"
            />

            <input
              value={searchInput}
              onChange={(e) =>
                setSearchInput(e.target.value)
              }
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

          {/* DATE */}

          <div className="relative flex h-[52px] w-[200px] items-center rounded-2xl border border-gray-200 bg-white px-4 shadow-sm">

            <CalendarDays
              size={19}
              className="mr-3 shrink-0"
            />

            <input
              type="date"
              value={tanggal}
              onChange={(e) => {
                setTanggal(e.target.value);
                setPage(1);
              }}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-gray-800 outline-none"
            />

            {tanggal && (
              <button
                type="button"
                onClick={() => {
                  setTanggal("");
                  setPage(1);
                }}
                className="ml-1"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* ADD */}

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard/jadwaldonor/tambah"
              )
            }
            className="flex h-[52px] items-center gap-5 rounded-2xl bg-[#ff2938] px-6 text-[13px] font-medium text-white shadow-sm transition hover:bg-red-600"
          >
            Tambah Rencana

            <Plus
              size={22}
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] border-collapse text-left text-[13px]">

            <thead>
              <tr className="border-b border-gray-400">

                <th className="px-6 py-4 font-bold">
                  ID
                </th>

                <th className="px-4 py-4 font-bold">
                  Tanggal
                </th>

                <th className="px-4 py-4 text-center font-bold">
                  Total Pendonor
                  <br />
                  (Online)
                </th>

                <th className="px-4 py-4 font-bold">
                  Waktu Mulai
                </th>

                <th className="px-4 py-4 font-bold">
                  Waktu Selesai
                </th>

                <th className="px-4 py-4 font-bold">
                  Lokasi Donor
                </th>

                <th className="px-4 py-4 font-bold">
                  Alamat Lokasi
                </th>

                <th className="px-4 py-4 font-bold">
                  Penyelenggara
                </th>

                <th className="px-4 py-4 text-center font-bold">
                  Action
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
                      colSpan={9}
                      className="h-[49px] px-6"
                    >
                      <div className="h-3 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))}

              {/* EMPTY */}

              {!loading &&
                jadwal.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-16 text-center text-gray-400"
                    >
                      Tidak ada jadwal donor
                      ditemukan.
                    </td>
                  </tr>
                )}

              {/* DATA */}

              {!loading &&
                jadwal.map((item) => (
                  <tr
                    key={item.id_jadwal}
                    className="border-b border-gray-300 last:border-b-0"
                  >

                    <td className="px-6 py-3">
                      {item.id_jadwal}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatTanggal(
                        item.tanggal_pelaksanaan
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {
                        item.total_pendaftar_online
                      }
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.jam_mulai ?? "-"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.jam_selesai ?? "-"}
                    </td>

                    <td className="px-4 py-3">
                      {item.lokasi
                        ?.nama_lokasi ?? "-"}
                    </td>

                    <td className="max-w-[230px] px-4 py-3">
                      <div className="truncate">
                        {item.lokasi?.alamat ??
                          "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {item.penyelenggara ??
                        "-"}
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
                              `/dashboard/jadwaldonor/${item.id_jadwal}`
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
                              `/dashboard/jadwaldonor/${item.id_jadwal}/edit`
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
                            mintaKonfirmasiHapus(
                              item.id_jadwal
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff2938] text-white shadow-sm transition hover:bg-red-600"
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

      {/* ================= PAGINATION ================= */}

      {!loading && (
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
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={17} />
          </button>

          {/* PAGES */}

          {getPages().map(
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

              const active =
                pageItem === page;

              return (
                <button
                  key={pageItem}
                  type="button"
                  onClick={() =>
                    setPage(pageItem)
                  }
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm shadow-sm transition ${
                    active
                      ? "bg-[#ff2938] text-white"
                      : "border border-gray-200 bg-white hover:bg-gray-100"
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
              page >=
              pagination.totalPages
            }
            onClick={() =>
              setPage((prev) =>
                Math.min(
                  pagination.totalPages,
                  prev + 1
                )
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      )}

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}

      <AskModal
        isOpen={konfirmasiHapusId !== null}
        variant="tanya"
        title="Konfirmasi Hapus"
        description="Apakah anda yakin ingin menghapus data?"
        buttonLabel={menghapus ? "Menghapus..." : "Hapus"}
        cancelLabel="Batal"
        onClose={() => {
          if (!menghapus) setKonfirmasiHapusId(null);
        }}
        onConfirm={konfirmasiHapus}
      />

      {/* ================= MODAL ERROR ================= */}

      <AskModal
        isOpen={modalError !== null}
        variant="warning"
        title="Gagal Menghapus"
        description={modalError ?? ""}
        buttonLabel="Tutup"
        onClose={() => setModalError(null)}
      />
    </div>
  );
}
