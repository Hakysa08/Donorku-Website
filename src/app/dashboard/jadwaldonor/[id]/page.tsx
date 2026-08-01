"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
  foto_lokasi: string | null;
  lokasi: {
    id_lokasi: number;
    nama_lokasi: string;
    alamat: string;
    kota: string;
  };
  penyelenggara: string;
};

function formatTanggal(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

const STATUS_LABEL: Record<string, string> = {
  aktif: "Aktif",
  nonaktif: "Nonaktif",
  selesai: "Selesai",
};

export default function DetailJadwalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<JadwalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

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

  async function handleHapus() {
    const yakin = window.confirm("Yakin ingin menghapus jadwal ini?");
    if (!yakin) return;

    try {
      const response = await fetch(
        `/api/web/auth/dashboard/jadwaldonor?id=${id}`,
        { method: "DELETE", credentials: "include" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menghapus jadwal");
      }

      router.push("/dashboard/jadwaldonor");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus jadwal");
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <button
          onClick={() => router.push("/dashboard/jadwaldonor")}
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/icons/arrow-left.svg" alt="" className="h-4 w-4" />
          Kembali
        </button>
        <p className="text-sm text-red-500">
          {error || "Jadwal tidak ditemukan"}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/jadwaldonor")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/button/back.png" alt="" className="h-4 w-4" />
          Kembali
        </button>

        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(`/dashboard/jadwaldonor/${id}/edit`)
            }
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/button/edit.png" alt="" className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={handleHapus}
            className="flex items-center gap-2 rounded-xl bg-[#ff2938] px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/button/delete.png" alt="" className="h-4 w-4" />
            Hapus
          </button>
        </div>
      </div>

      <h1 className="mb-1 text-[28px] font-bold">{data.lokasi.nama_lokasi}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {formatTanggal(data.tanggal_pelaksanaan)} • {data.jam_mulai}-
        {data.jam_selesai}
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-gray-900">Detail Lokasi</h2>
          <dl className="grid grid-cols-2 gap-y-4 text-sm">
            <dt className="text-gray-400">Nama Lokasi</dt>
            <dd className="font-medium">{data.lokasi.nama_lokasi}</dd>

            <dt className="text-gray-400">Alamat</dt>
            <dd className="font-medium">{data.lokasi.alamat}</dd>

            <dt className="text-gray-400">Kota</dt>
            <dd className="font-medium">{data.lokasi.kota}</dd>

            <dt className="text-gray-400">Status Jadwal</dt>
            <dd className="font-medium">
              {STATUS_LABEL[data.status_jadwal] ?? data.status_jadwal}
            </dd>

            <dt className="text-gray-400">Penyelenggara</dt>
            <dd className="font-medium">{data.penyelenggara}</dd>
          </dl>

          <h2 className="mb-4 mt-8 font-semibold text-gray-900">
            Penanggung Jawab
          </h2>
          <dl className="grid grid-cols-2 gap-y-4 text-sm">
            <dt className="text-gray-400">Nama</dt>
            <dd className="font-medium">
              {data.nama_penanggung_jawab ?? "-"}
            </dd>

            <dt className="text-gray-400">Kontak</dt>
            <dd className="font-medium">
              {data.kontak_penanggung_jawab ?? "-"}
            </dd>
          </dl>

          <h2 className="mb-4 mt-8 font-semibold text-gray-900">
            Statistik Donor
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Kuota", data.kuota],
              ["Pendaftar Online", data.total_pendaftar_online],
              ["Pendonor Offline", data.total_pendonor_offline],
              ["Hadir", data.pendonor_hadir],
              ["Darah Terkumpul", data.darah_terkumpul],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="rounded-xl border border-gray-100 p-3 text-center"
              >
                <p className="text-2xl font-bold text-red-600">{value}</p>
                <p className="mt-1 text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Foto Lokasi</h2>
          {data.foto_lokasi ? (
            <div className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.foto_lokasi}
                alt={data.lokasi.nama_lokasi}
                className="h-56 w-full rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 shadow hover:bg-white"
                title="Preview"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/button/view.png"
                  alt="Preview"
                  className="h-4 w-4"
                />
              </button>
            </div>
          ) : (
            <div className="flex h-56 w-full items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400">
              Belum ada foto
            </div>
          )}
        </div>
      </div>

      {showModal && data.foto_lokasi && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-h-[85vh] max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/button/close.png" alt="Tutup" className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.foto_lokasi}
              alt={data.lokasi.nama_lokasi}
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}