"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, Search, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import AskModal from "@/components/AskModal";
import DateFilter from "@/components/DateFilter";

/* =========================================================
   TYPE
========================================================= */

type Riwayat = {
  id_riwayat: number;
  tanggal_donor: string;
  status_donor: string;
  lokasi_donor: string;
  darah_terkumpul: number | null;
  pendonor: {
    id_pendonor: number;
    nama_lengkap: string;
    email: string;
    golongan_darah: string;
    jenis_kelamin: string;
    tanggal_lahir: string;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const STATUS_DONOR_LABEL: Record<string, string> = {
  berhasil: "Berhasil",
  gagal: "Gagal",
  ditunda: "Ditunda",
};

const STATUS_DONOR_COLOR: Record<string, string> = {
  berhasil: "text-green-600",
  gagal: "text-red-600",
  ditunda: "text-yellow-600",
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
   PAGE
========================================================= */

export default function RiwayatDonorPage() {
  const router = useRouter();

  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [tanggal, setTanggal] = useState<Date | undefined>();

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });

  const [ekspor, setEkspor] = useState(false);

  /* HAPUS */
  const [targetHapus, setTargetHapus] = useState<number | null>(null);
  const [hapusLoading, setHapusLoading] = useState(false);

  /* =======================================================
     FETCH LIST
  ======================================================= */

  const ambilRiwayat = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "9");

      if (search) params.set("search", search);
      if (tanggal)
        params.set("tanggal", format(tanggal, "yyyy-MM-dd"));

      const res = await fetch(
        `/api/web/auth/dashboard/riwayat?${params.toString()}`,
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
          result.message || "Gagal mengambil riwayat donor"
        );
      }

      setRiwayat(result.data);
      setPagination(result.pagination);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, tanggal]);

  useEffect(() => {
    ambilRiwayat();
  }, [ambilRiwayat]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  /* =======================================================
     HAPUS RIWAYAT
  ======================================================= */

  async function konfirmasiHapus() {
    if (targetHapus === null) return;

    try {
      setHapusLoading(true);

      const res = await fetch(
        `/api/web/auth/dashboard/riwayat/${targetHapus}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal menghapus riwayat"
        );
      }

      setTargetHapus(null);

      /* Bila baris terakhir di halaman terhapus, mundur satu halaman. */
      if (riwayat.length === 1 && page > 1) {
        setPage((c) => c - 1);
      } else {
        ambilRiwayat();
      }
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal menghapus riwayat"
      );
    } finally {
      setHapusLoading(false);
    }
  }

  /* =======================================================
     EKSPOR CSV
  ======================================================= */

  async function eksporCSV() {
    try {
      setEkspor(true);

      const params = new URLSearchParams();
      params.set("all", "true");
      if (search) params.set("search", search);
      if (tanggal)
        params.set("tanggal", format(tanggal, "yyyy-MM-dd"));

      const res = await fetch(
        `/api/web/auth/dashboard/riwayat?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal mengekspor data"
        );
      }

      const baris: Riwayat[] = result.data;

      const header = [
        "ID",
        "Nama Lengkap",
        "Email",
        "Golongan Darah",
        "Jenis Kelamin",
        "Umur",
        "Tanggal Pendonoran",
        "Lokasi Donor",
      ];

      const isi = baris.map((item) => [
        item.id_riwayat,
        item.pendonor.nama_lengkap,
        item.pendonor.email,
        item.pendonor.golongan_darah,
        formatJenisKelamin(item.pendonor.jenis_kelamin),
        hitungUmur(item.pendonor.tanggal_lahir),
        formatTanggalPendek(item.tanggal_donor),
        item.lokasi_donor,
      ]);

      unduhCSV([header, ...isi], "riwayat-donor.csv");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal mengekspor data"
      );
    } finally {
      setEkspor(false);
    }
  }

  const halaman = buatNomorHalaman(
    pagination.page,
    pagination.totalPages
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7">
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-[36px] font-bold tracking-tight text-black">
          Riwayat Donor
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

          {/* EKSPOR KE EXCEL */}
          <button
            type="button"
            onClick={eksporCSV}
            disabled={ekspor}
            className="flex h-[52px] items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 text-[13px] font-medium text-black shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
          >
            <Image
              src="/ekspor/excel.png"
              alt=""
              width={18}
              height={18}
              className="object-contain"
            />
            {ekspor ? "Mengekspor..." : "Ekspor ke Excel"}
          </button>
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

              {!loading && !error && riwayat.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center text-gray-400">
                    Data riwayat donor tidak ditemukan
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                riwayat.map((item) => (
                  <tr
                    key={item.id_riwayat}
                    className="border-b border-black-300 last:border-b-0"
                  >
                    <td className="px-6 py-5 text-[14px]">{item.id_riwayat}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.pendonor.nama_lengkap}
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <div className="truncate" title={item.pendonor.email}>
                        {item.pendonor.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.pendonor.golongan_darah}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatJenisKelamin(item.pendonor.jenis_kelamin)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {hitungUmur(item.pendonor.tanggal_lahir)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatTanggalPendek(item.tanggal_donor)}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <div className="truncate" title={item.lokasi_donor}>
                        {item.lokasi_donor}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[13px] font-semibold ${
                          STATUS_DONOR_COLOR[item.status_donor] ?? "text-black"
                        }`}
                      >
                        {STATUS_DONOR_LABEL[item.status_donor] ?? item.status_donor}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="Detail Riwayat"
                          onClick={() =>
                            router.push(`/dashboard/riwayat/${item.id_riwayat}`)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100"
                        >
                          <Eye size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          title="Hapus Riwayat"
                          onClick={() => setTargetHapus(item.id_riwayat)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm transition hover:bg-red-500"
                        >
                          <Trash2 size={16} strokeWidth={2} />
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

      {/* KONFIRMASI HAPUS */}
      <AskModal
        isOpen={targetHapus !== null}
        variant="tanya"
        title="Konfirmasi Hapus"
        description="Apakah anda yakin ingin menghapus data?"
        buttonLabel={hapusLoading ? "Menghapus..." : "Hapus"}
        cancelLabel="Batal"
        onConfirm={konfirmasiHapus}
        onClose={() => {
          if (!hapusLoading) setTargetHapus(null);
        }}
      />
    </div>
  );
}

/* =========================================================
   EKSPOR CSV
========================================================= */

function unduhCSV(baris: (string | number)[][], namaFile: string) {
  const konten = baris
    .map((kolom) =>
      kolom
        .map((sel) => {
          const teks = String(sel ?? "");
          if (/[",\n]/.test(teks)) {
            return `"${teks.replace(/"/g, '""')}"`;
          }
          return teks;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + konten], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = namaFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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