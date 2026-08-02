"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, Search, X } from "lucide-react";
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

const STATUS_INFO: Record<StatusPendaftaran, { label: string; kelas: string }> = {
  menunggu: { label: "Menunggu", kelas: "bg-[#F4FF5B] text-black" },
  diterima: { label: "Diterima", kelas: "bg-[#68FF5B] text-black" },
  ditolak: { label: "Ditolak", kelas: "bg-[#EC2727] text-white" },
  dibatalkan: { label: "Dibatalkan", kelas: "bg-[#EC2727] text-white" },
  selesai: { label: "Selesai", kelas: "bg-[#68FF5B] text-black" },
  batal_hadir: { label: "Batal Hadir", kelas: "bg-[#EC2727] text-white" },
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

  const halaman = buatNomorHalaman(pagination.page, pagination.totalPages);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-[36px] font-bold tracking-tight text-black">
          Daftar Pendonor
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* SEARCH */}
          <div className="flex h-[52px] w-[295px] items-center rounded-2xl border border-gray-200 bg-white px-5 shadow-sm text-black">
            <Search size={22} strokeWidth={2} className="shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
              className="h-[52px] w-[190px] cursor-pointer appearance-none rounded-2xl border border-gray-200 bg-white pl-5 pr-9 text-[13px] text-black shadow-sm outline-none"
            >
              <option value="">Lokasi Donor</option>
              {opsi.lokasi.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left text-[13px] text-black">
            <thead>
              <tr className="border-b border-black-400 text-black">
                <th className="px-6 py-5 text-[14px] font-bold">ID</th>
                <th className="px-4 py-3 text-[14px] font-bold">Nama Lengkap</th>
                <th className="px-4 py-3 text-[14px] font-bold">Email</th>
                <th className="px-4 py-3 text-[14px] font-bold">Golongan darah</th>
                <th className="px-4 py-3 text-[14px] font-bold">Jenis Kelamin</th>
                <th className="px-4 py-3 text-[14px] font-bold">Umur</th>
                <th className="px-4 py-3 text-[14px] font-bold">Tanggal Pendonoran</th>
                <th className="px-4 py-3 text-[14px] font-bold">Lokasi Donor</th>
                <th className="px-4 py-3 text-center text-[14px] font-bold">Status</th>
                <th className="px-4 py-3 text-center text-[14px] font-bold">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 9 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td colSpan={10} className="h-[49px] px-6">
                      <div className="h-3 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))}

              {!loading && error && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && baris.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-gray-400">
                    Data pendaftaran tidak ditemukan
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                baris.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-black-300 last:border-b-0"
                  >
                    <td className="px-6 py-5 text-[14px]">{item.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.nama_lengkap}
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <div className="truncate" title={item.email}>
                        {item.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.golongan_darah}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatJenisKelamin(item.jenis_kelamin)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hitungUmur(item.tanggal_lahir)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatTanggalPendek(item.tanggal_pendonoran)}
                    </td>
                    <td className="max-w-[180px] px-4 py-3">
                      <div className="truncate" title={item.lokasi_donor}>
                        {item.lokasi_donor}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <BadgeStatus status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          title="Detail Pendonor"
                          onClick={() =>
                            router.push(`/dashboard/pendonor/${item.id}`)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100"
                        >
                          <Eye size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION */}
      {!loading && !error && pagination.total > 0 && (
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((c) => Math.max(1, c - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 text-black"
          >
            <ChevronLeft size={17} />
          </button>

          {halaman.map((item, index) =>
            item === "..." ? (
              <div
                key={`ellipsis-${index}`}
                className="flex h-8 min-w-8 items-center justify-center px-1 text-sm text-black"
              >
                ...
              </div>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPage(Number(item))}
                className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm shadow-sm transition ${
                  page === item
                    ? "bg-red-600 text-white"
                    : "border border-gray-200 bg-white hover:bg-gray-100 text-black"
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
              setPage((c) => Math.min(pagination.totalPages, c + 1))
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 text-black"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PAGINATION HELPER
========================================================= */

function buatNomorHalaman(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) return [1, 2, 3, "...", total];
  if (current >= total - 2) return [1, "...", total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}