"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pencil,
  X,
} from "lucide-react";

import BackButton from "@/components/BackButton";

/* =========================================================
   TYPE
========================================================= */

type JadwalDetail = {
  id_jadwal: number;
  id_lokasi: number;
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
  foto_lokasi: string[] | null;
  lokasi: {
    id_lokasi: number;
    nama_lokasi: string;
    alamat: string;
    kota: string;
  };
  penyelenggara: string;
};

/* =========================================================
   FORMAT HELPER
========================================================= */

function formatTanggal(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatHari(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
}

function formatJam(value: string | null) {
  if (!value) return "-";
  const hhmm = value.length >= 5 ? value.slice(0, 5) : value;
  return hhmm.replace(":", ".");
}

function formatAngka(value: number | null | undefined) {
  return value ? String(value) : "-";
}

/* =========================================================
   DETAIL ITEM (label di atas, value bold di bawah)
========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-base text-black">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* =========================================================
   DIVIDER ANTAR SECTION
========================================================= */

function Divider() {
  return <div className="my-9 h-1 w-full rounded-full bg-gray-400" />;
}

/* =========================================================
   PAGE
========================================================= */

export default function DetailJadwalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<JadwalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [fotoIndex, setFotoIndex] = useState(0);

  useEffect(() => {
    async function ambilDetail() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/web/auth/dashboard/jadwaldonor/${id}`,
          { credentials: "include", cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil detail jadwal");
        }

        setData(result.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal mengambil detail jadwal"
        );
      } finally {
        setLoading(false);
      }
    }

    ambilDetail();
  }, [id]);

  /* =======================================================
     FOTO (array, carousel)
  ======================================================= */

  const fotoArray: string[] = Array.isArray(data?.foto_lokasi)
    ? (data?.foto_lokasi as string[])
    : [];

  function fotoSebelumnya() {
    setFotoIndex((prev) =>
      prev === 0 ? fotoArray.length - 1 : prev - 1
    );
  }

  function fotoBerikutnya() {
    setFotoIndex((prev) =>
      prev === fotoArray.length - 1 ? 0 : prev + 1
    );
  }

  /* =======================================================
     LOADING / ERROR
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <div className="h-10 w-64 animate-pulse rounded bg-gray-100" />
        <div className="mt-9 h-96 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <BackButton
          onClick={() => router.push("/dashboard/jadwaldonor")}
          className="mb-7"
        />

        <p className="text-base text-red-500">
          {error || "Jadwal tidak ditemukan"}
        </p>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      {/* HEADER */}
      <div className="mb-9 flex items-start justify-between">
        <h1 className="text-[43px] font-bold leading-tight tracking-tight">
          Jadwal Donor
          <br />
          ID {id}
        </h1>

        <div className="flex items-center gap-3">
          <BackButton
            onClick={() => router.push("/dashboard/jadwaldonor")}
          />

          <button
            onClick={() =>
              router.push(`/dashboard/jadwaldonor/${id}/edit`)
            }
            className="flex h-[53px] items-center gap-2 rounded-full bg-red-600 px-7 text-base font-semibold text-white hover:bg-red-500"
          >
            <Pencil size={19} />
            Edit
          </button>
        </div>
      </div>

      {/* FOTO + DETAIL JADWAL */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* FOTO CAROUSEL */}
        <div className="group relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl border border-gray-500 bg-gray-50 lg:w-80">
          {fotoArray.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoArray[fotoIndex]}
                alt={data.lokasi.nama_lokasi}
                className="h-full w-full object-cover"
              />

              {fotoArray.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={fotoSebelumnya}
                    title="Foto sebelumnya"
                    className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow hover:bg-white"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={fotoBerikutnya}
                    title="Foto berikutnya"
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-700 shadow hover:bg-white"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {fotoArray.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === fotoIndex
                            ? "w-4 bg-white"
                            : "w-1.5 bg-white/60"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowModal(true)}
                title="Perbesar foto"
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white"
              >
                <Maximize2 size={14} />
              </button>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-base text-gray-400">
              Belum ada foto
            </div>
          )}
        </div>

        {/* DETAIL JADWAL */}
        <div className="flex-1">
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Detail Jadwal
          </h2>

          <div className="grid grid-cols-1 gap-x-10 gap-y-7 sm:grid-cols-3">
            <DetailItem
              label="Tanggal"
              value={formatTanggal(data.tanggal_pelaksanaan)}
            />
            <DetailItem
              label="Waktu Mulai"
              value={formatJam(data.jam_mulai)}
            />
            <DetailItem
              label="Waktu Selesai"
              value={formatJam(data.jam_selesai)}
            />

            <DetailItem label="Penyelenggara" value={data.penyelenggara} />
            <DetailItem label="Lokasi" value={data.lokasi.nama_lokasi} />
            <DetailItem
              label="Hari"
              value={formatHari(data.tanggal_pelaksanaan)}
            />

            <div className="sm:col-span-3">
              <DetailItem label="Alamat Lokasi" value={data.lokasi.alamat} />
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* DETAIL DONOR */}
      <h2 className="mb-5 text-xl font-bold text-gray-900">Detail Donor</h2>

      <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
        <DetailItem
          label="Kuota Maksimal"
          value={formatAngka(data.kuota)}
        />
        <DetailItem
          label="Sisa Kuota"
          value={formatAngka(
            Math.max(0, data.kuota - (data.total_pendonor_offline ?? 0))
          )}
        />
        <DetailItem
          label="Total Pendaftar (Online)"
          value={formatAngka(data.total_pendaftar_online)}
        />
        <DetailItem
          label="Total Pendonor (Offline)"
          value={formatAngka(data.total_pendonor_offline)}
        />
        <DetailItem
          label="Pendonor Hadir"
          value={formatAngka(data.pendonor_hadir)}
        />
        <DetailItem
          label="Darah Terkumpul"
          value={formatAngka(data.darah_terkumpul)}
        />
      </div>

      <Divider />

      {/* PENANGGUNG JAWAB */}
      <h2 className="mb-5 text-xl font-bold text-gray-900">
        Penanggung Jawab
      </h2>

      <div className="flex flex-col gap-y-7 sm:flex-row sm:gap-x-16">
        <DetailItem
          label="Nama"
          value={data.nama_penanggung_jawab ?? "-"}
        />
        <DetailItem
          label="Kontak"
          value={data.kontak_penanggung_jawab ?? "-"}
        />
      </div>

      {/* MODAL LIGHTBOX */}
      {showModal && fotoArray.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white"
            >
              <X size={18} />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoArray[fotoIndex]}
              alt={data.lokasi.nama_lokasi}
              className="max-h-[85vh] w-full rounded-2xl bg-black object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
