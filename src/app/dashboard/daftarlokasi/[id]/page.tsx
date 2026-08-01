"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, MapPin, Pencil, X } from "lucide-react";

type Lokasi = {
  id_lokasi: number;
  nama_lokasi: string;
  alamat: string;
  kota: string;
  no_hp: string | null;
  longitude: string | number | null;
  latitude: string | number | null;
  foto_url: string | null;
};

export default function DetailLokasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [lokasi, setLokasi] = useState<Lokasi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modal preview foto (lightbox)
  const [previewFoto, setPreviewFoto] = useState(false);

  useEffect(() => {
    async function ambilDetail() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/web/auth/dashboard/daftarlokasi/${id}`,
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              result.message ||
              "Gagal mengambil detail lokasi"
          );
        }

        setLokasi(result.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan"
        );
      } finally {
        setLoading(false);
      }
    }

    ambilDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-400">
        Memuat detail lokasi...
      </div>
    );
  }

  if (error || !lokasi) {
    return (
      <div className="w-full px-10 py-7">
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error || "Lokasi tidak ditemukan"}
        </div>
      </div>
    );
  }

  const fotoSrc = lokasi.foto_url
    ? `${lokasi.foto_url}?v=${Date.now()}`
    : null;

  return (
    <div className="w-full px-10 pb-10 pt-6 text-black">

      {/* HEADER: judul kiri (2 baris), tombol Kembali + Edit kanan, sejajar */}
      <div className="mb-8 flex items-start justify-between">
        <h1 className="text-[28px] font-bold leading-tight">
          Detail Lokasi
          <br />
          ID {lokasi.id_lokasi}
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/daftarlokasi")}
            className="flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <img src="/button/back.png" alt="Kembali" width={16} height={16} /> Kembali
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/dashboard/daftarlokasi/${lokasi.id_lokasi}/edit`
              )
            }
            className="flex h-10 items-center gap-2 rounded-full bg-[#ff2938] px-5 text-sm font-medium text-white hover:bg-red-600"
          >
            <img src="/button/edit.png" alt="Edit" width={16} height={16} /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr]">

        {/* FOTO */}
        <div>
          <div className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
            {fotoSrc ? (
              <>
                <Image
                  src={fotoSrc}
                  alt={lokasi.nama_lokasi}
                  fill
                  unoptimized
                  className="object-cover"
                />

                <button
                  type="button"
                  title="Lihat foto"
                  onClick={() => setPreviewFoto(true)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow hover:bg-gray-50"
                >
                  <img src="/button/view.png" alt="Lihat foto" width={16} height={16} />
                </button>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-gray-300">
                <MapPin size={48} strokeWidth={1.3} />
                <span className="mt-3 text-sm">Belum ada foto</span>
              </div>
            )}
          </div>
        </div>

        {/* DETAIL */}
        <div>
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Detail Lokasi
          </h2>

          <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
            <DetailItem label="Lokasi Donor" value={lokasi.nama_lokasi} />
            <DetailItem label="No Petugas" value={lokasi.no_hp || "-"} />
            <DetailItem label="Kota" value={lokasi.kota} />
          </div>

          <div className="mt-6">
            <DetailItem label="Alamat Lokasi" value={lokasi.alamat} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
            <DetailItem
              label="Longitude"
              value={
                lokasi.longitude !== null
                  ? String(lokasi.longitude)
                  : "-"
              }
            />
            <DetailItem
              label="Latitude"
              value={
                lokasi.latitude !== null
                  ? String(lokasi.latitude)
                  : "-"
              }
            />
          </div>
        </div>
      </div>

      <hr className="mt-10 border-gray-300" />

      {/* MODAL PREVIEW FOTO */}
      {previewFoto && fotoSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setPreviewFoto(false)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewFoto(false)}
              className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white"
            >
              <img src="/button/close.png" alt="Tutup" width={16} height={16} />
            </button>

            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <Image
                src={fotoSrc}
                alt={lokasi.nama_lokasi}
                fill
                unoptimized
                className="object-contain bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1 text-sm text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}
