"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, X } from "lucide-react";

/* =========================================================
   TYPE
========================================================= */

type Lokasi = {
  id_lokasi: number;
  nama_lokasi: string;
  alamat: string;
};

type StatusStok = "aman" | "menipis" | "kritis";

type Stok = {
  id_stok: number;
  golongan_darah: string;
  jumlah_kantong: number;
  status: StatusStok;
  tanggal_update: string;
  lokasi: Lokasi | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiResponse = {
  message: string;
  data: Stok[];
  pagination: Pagination;
};

const GOLONGAN_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const STATUS_OPTIONS: { value: StatusStok; label: string }[] = [
  { value: "aman", label: "Aman" },
  { value: "menipis", label: "Menipis" },
  { value: "kritis", label: "Kritis" },
];

const STATUS_BADGE: Record<StatusStok, string> = {
  aman: "bg-[#68FF5B] text-black",
  menipis: "bg-[#F4FF5B] text-black",
  kritis: "bg-[#EC2727] text-black",
};

const STATUS_LABEL: Record<StatusStok, string> = {
  aman: "Aman",
  menipis: "Menipis",
  kritis: "Kritis",
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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/* =========================================================
   DROPDOWN FILTER SEDERHANA
========================================================= */

function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  const current = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[52px] w-[190px] items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 text-[13px] text-black shadow-sm"
      >
        <span className="truncate">
          {current ? current.label : label}
        </span>
        <ChevronDown size={16} className="shrink-0 text-gray-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-[190px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-[13px] text-gray-500 hover:bg-gray-50"
            >
              Semua {label}
            </button>

            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-[13px] hover:bg-gray-50 ${
                  option.value === value
                    ? "font-semibold text-red-600"
                    : "text-black"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function StokDarahPage() {
  const router = useRouter();

  const [stok, setStok] = useState<Stok[]>([]);
  const [loading, setLoading] = useState(true);

  const [golongan, setGolongan] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
  });

  const ambilStok = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "8");

      if (golongan) params.set("golongan_darah", golongan);
      if (status) params.set("status", status);

      const response = await fetch(
        `/api/web/auth/dashboard/stokdarah?${params.toString()}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal mengambil data stok darah");
      }

      const data = result as ApiResponse;

      setStok(data.data ?? []);
      setPagination(
        data.pagination ?? { page: 1, limit: 8, total: 0, totalPages: 1 }
      );
    } catch (error) {
      console.error(error);
      setStok([]);
    } finally {
      setLoading(false);
    }
  }, [page, golongan, status]);

  useEffect(() => {
    ambilStok();
  }, [ambilStok]);

  function getPages() {
    const total = pagination.totalPages;

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];

    if (page <= 3) {
      pages.push(1, 2, 3, "...", total);
    } else if (page >= total - 2) {
      pages.push(1, "...", total - 2, total - 1, total);
    } else {
      pages.push(1, "...", page, "...", total);
    }

    return pages;
  }

  return (
    <div className="min-h-full bg-white px-10 py-7">
      {/* ================= HEADER ================= */}

      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-[36px] font-bold tracking-tight text-black">
          Stok Darah
        </h1>

        <div className="flex items-center gap-3">
          <FilterDropdown
            label="Golongan Darah"
            value={golongan}
            onChange={(value) => {
              setGolongan(value);
              setPage(1);
            }}
            options={GOLONGAN_OPTIONS.map((g) => ({ value: g, label: g }))}
          />

          <FilterDropdown
            label="Status"
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />

          {(golongan || status) && (
            <button
              type="button"
              onClick={() => {
                setGolongan("");
                setStatus("");
                setPage(1);
              }}
              className="flex h-[52px] items-center gap-1 rounded-2xl border border-gray-200 bg-white px-5 text-[13px] text-black shadow-sm hover:bg-gray-50"
            >
              <X size={15} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ================= TABLE ================= */}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-[13px] text-black">
            <thead>
              <tr className="border-b border-black-400 text-black">
                <th className="px-6 py-5 text-[14px] font-bold">ID</th>
                <th className="px-4 py-3 text-[14px] font-bold">Golongan Darah</th>
                <th className="px-4 py-3 text-[14px] font-bold">Lokasi</th>
                <th className="px-4 py-3 text-[14px] font-bold">Jumlah Stok</th>
                <th className="px-4 py-3 text-[14px] font-bold">Status</th>
                <th className="px-4 py-3 text-[14px] font-bold">Terakhir Diperbarui</th>
                <th className="px-4 py-3 text-center text-[14px] font-bold">Action</th>
              </tr>
            </thead>

            <tbody>
              {/* LOADING */}
              {loading &&
                Array.from({ length: 8 }).map((_, index) => (
                  <tr key={index} className="border-b border-gray-300">
                    <td colSpan={7} className="h-[49px] px-6">
                      <div className="h-3 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))}

              {/* EMPTY */}
              {!loading && stok.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                    Tidak ada data stok darah ditemukan.
                  </td>
                </tr>
              )}

              {/* DATA */}
              {!loading &&
                stok.map((item) => (
                  <tr
                    key={item.id_stok}
                    className="border-b border-black-300 last:border-b-0"
                  >
                    <td className="px-6 py-5 text-[14px]">{item.id_stok}</td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.golongan_darah}
                    </td>

                    <td className="px-4 py-3">
                      {item.lokasi?.nama_lokasi ?? "-"}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.jumlah_kantong}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${STATUS_BADGE[item.status]}`}
                      >
                        {STATUS_LABEL[item.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatTanggal(item.tanggal_update)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() =>
                            router.push(`/dashboard/stok-darah/${item.id_stok}/edit`)
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition hover:bg-gray-100"
                        >
                          <Pencil size={16} strokeWidth={2} />
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
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40 text-black"
          >
            <ChevronLeft size={17} />
          </button>

          {getPages().map((pageItem, index) => {
            if (pageItem === "...") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="flex h-8 min-w-8 items-center justify-center px-1 text-sm text-black"
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
          })}

          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage((prev) => Math.min(pagination.totalPages, prev + 1))
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