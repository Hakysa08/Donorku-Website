"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  X,
} from "lucide-react";

import { format } from "date-fns";

import DateFilter from "@/components/DateFilter";

/* =========================================================
   TYPE
========================================================= */

type StatusPendaftaran =
  | "menunggu"
  | "diterima"
  | "ditolak"
  | "dibatalkan"
  | "selesai"
  | "batal_hadir";

type Baris = {
  id: number;
  id_pendonor: number;
  nama_lengkap: string;
  email: string;
  golongan_darah: string;
  jenis_kelamin: string;
  tanggal_lahir: string;
  tanggal_pendonoran: string;
  lokasi_donor: string;
  status: StatusPendaftaran;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Opsi = {
  lokasi: string[];
  tanggal: string[];
};

/* =========================================================
   HELPER
========================================================= */

function formatJenisKelamin(nilai: string): string {
  if (nilai === "Laki_laki") return "Laki-Laki";
  return nilai;
}

/* Tanggal pendonoran -> dd/mm/yyyy (sesuai Figma) */
function formatTanggalPendek(iso?: string | null): string {
  if (!iso) return "-";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "-";
  const dd = String(t.getDate()).padStart(2, "0");
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${t.getFullYear()}`;
}

function hitungUmur(iso?: string | null): number | string {
  if (!iso) return "-";
  const lahir = new Date(iso);
  if (Number.isNaN(lahir.getTime())) return "-";

  const sekarang = new Date();
  let umur = sekarang.getFullYear() - lahir.getFullYear();
  const selisih = sekarang.getMonth() - lahir.getMonth();

  if (
    selisih < 0 ||
    (selisih === 0 && sekarang.getDate() < lahir.getDate())
  ) {
    umur--;
  }

  return umur;
}

/* =========================================================
   STATUS BADGE
========================================================= */

const STATUS_INFO: Record<
  StatusPendaftaran,
  { label: string; kelas: string }
> = {
  menunggu: {
    label: "Menunggu",
    kelas: "bg-[#F4D53E] text-[#4A3B00]",
  },
  diterima: {
    label: "Diterima",
    kelas: "bg-[#4CD471] text-white",
  },
  ditolak: {
    label: "Ditolak",
    kelas: "bg-[#F0453C] text-white",
  },
  dibatalkan: {
    label: "Dibatalkan",
    kelas: "bg-[#9AA0A6] text-white",
  },
  selesai: {
    label: "Selesai",
    kelas: "bg-[#3B82F6] text-white",
  },
  batal_hadir: {
    label: "Batal Hadir",
    kelas: "bg-[#9AA0A6] text-white",
  },
};

function BadgeStatus({ status }: { status: StatusPendaftaran }) {
  const info = STATUS_INFO[status] ?? {
    label: status,
    kelas: "bg-gray-200 text-gray-600",
  };

  return (
    <span
      className={`inline-flex min-w-[92px] items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold ${info.kelas}`}
    >
      {info.label}
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function DaftarPendonorPage() {
  const router = useRouter();

  const [baris, setBaris] = useState<Baris[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [tanggal, setTanggal] = useState<Date | undefined>();
  const [lokasi, setLokasi] = useState("");

  const [opsi, setOpsi] = useState<Opsi>({
    lokasi: [],
    tanggal: [],
  });

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });

  /* =======================================================
     FETCH LIST
  ======================================================= */

  const ambilData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "9");

      if (search) params.set("search", search);
      if (tanggal)
        params.set("tanggal", format(tanggal, "yyyy-MM-dd"));
      if (lokasi) params.set("lokasi", lokasi);

      const res = await fetch(
        `/api/web/auth/dashboard/pendonor?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(
          `API tidak mengembalikan JSON (${res.status})`
        );
      }

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal mengambil data pendonor"
        );
      }

      setBaris(result.data);
      setPagination(result.pagination);
      if (result.options) setOpsi(result.options);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, tanggal, lokasi]);

  useEffect(() => {
    ambilData();
  }, [ambilData]);

  /* SEARCH DEBOUNCE */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const halaman = buatNomorHalaman(
    pagination.page,
    pagination.totalPages
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full px-2 pb-10 pt-6 text-black">

      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-[32px] font-bold tracking-tight">
          Daftar Pendonor
        </h1>

        <div className="flex flex-wrap items-center gap-3">

          {/* SEARCH */}
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              type="text"
              placeholder="Cari Disini"
              className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-10 text-sm text-black shadow-sm outline-none transition focus:ring-2 focus:ring-red-100"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* FILTER TANGGAL */}
          <DateFilter
            value={tanggal}
            onChange={(date) => {
              setTanggal(date);
              setPage(1);
            }}
          />

          {/* FILTER LOKASI */}
          <div className="relative">
            <select
              value={lokasi}
              onChange={(e) => {
                setLokasi(e.target.value);
                setPage(1);
              }}
              className="h-11 w-[170px] cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white pl-4 pr-9 text-sm text-black shadow-sm outline-none transition focus:ring-2 focus:ring-red-100"
            >
              <option value="">Lokasi Donor</option>
              {opsi.lokasi.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 text-black">
                <th className="px-5 py-4 text-xs font-bold">ID</th>
                <th className="px-5 py-4 text-xs font-bold">Nama Lengkap</th>
                <th className="px-5 py-4 text-xs font-bold">Email</th>
                <th className="px-5 py-4 text-xs font-bold">Golongan darah</th>
                <th className="px-5 py-4 text-xs font-bold">Jenis Kelamin</th>
                <th className="px-5 py-4 text-xs font-bold">Umur</th>
                <th className="px-5 py-4 text-xs font-bold">Tanggal Pendonoran</th>
                <th className="px-5 py-4 text-xs font-bold">Lokasi Donor</th>
                <th className="px-5 py-4 text-center text-xs font-bold">Status</th>
                <th className="px-5 py-4 text-center text-xs font-bold">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-sm text-gray-400">
                    Memuat data...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-sm text-red-500">
                    {error}
                  </td>
                </tr>
              ) : baris.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-5 py-16 text-center text-sm text-gray-400">
                    Data pendaftaran tidak ditemukan
                  </td>
                </tr>
              ) : (
                baris.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 text-black transition last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-medium">
                      {item.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-medium">
                      {item.nama_lengkap}
                    </td>
                    <td className="max-w-[220px] px-5 py-4 text-xs">
                      <div className="truncate" title={item.email}>
                        {item.email}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs font-semibold">
                      {item.golongan_darah}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      {formatJenisKelamin(item.jenis_kelamin)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      {hitungUmur(item.tanggal_lahir)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      {formatTanggalPendek(item.tanggal_pendonoran)}
                    </td>
                    <td className="max-w-[180px] px-5 py-4 text-xs">
                      <div className="truncate" title={item.lokasi_donor}>
                        {item.lokasi_donor}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <BadgeStatus status={item.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          title="Detail Pendonor"
                          onClick={() =>
                            router.push(`/dashboard/pendonor/${item.id}`)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-100"
                        >
                          <Eye size={16} />
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

      {/* PAGINATION */}
      {!loading && !error && pagination.total > 0 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Menampilkan {baris.length} dari {pagination.total} pendaftaran
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((c) => Math.max(1, c - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {halaman.map((item, index) =>
              item === "..." ? (
                <span
                  key={`e-${index}`}
                  className="flex h-8 min-w-8 items-center justify-center text-xs"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(Number(item))}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs transition ${
                    page === item
                      ? "border-[#EC2727] bg-[#EC2727] text-white"
                      : "border-gray-200 bg-white text-black hover:bg-gray-50 shadow-sm"
                  }`}
                >
                  {item}
                </button>
              )
            )}

            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((c) =>
                  Math.min(pagination.totalPages, c + 1)
                )
              }
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PAGINATION HELPER
========================================================= */

function buatNomorHalaman(
  current: number,
  total: number
): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) return [1, 2, 3, "...", total];
  if (current >= total - 2)
    return [1, "...", total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}
