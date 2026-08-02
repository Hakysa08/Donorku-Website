"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { ArrowRight, ChevronDown, X } from "lucide-react";

import BackButton from "@/components/BackButton";
import { fotoPendonor } from "@/lib/fotoPendonor";

/* =========================================================
   TYPE
========================================================= */

type StatusDonor = "berhasil" | "gagal" | "ditunda";

type RiwayatDetail = {
  id_riwayat: number;
  tanggal_donor: string;
  status_donor: StatusDonor;
  lokasi_donor: string;
  keterangan: string | null;
  darah_terkumpul: number | null;
  alamat_lokasi: string | null;
  pendonor: {
    id_pendonor: number;
    nama_lengkap: string;
    golongan_darah: string;
    jenis_kelamin: string;
    tanggal_lahir: string;
    alamat: string | null;
    no_hp: string | null;
    email: string;
    foto_profil: string | null;
  };
};

/* =========================================================
   HELPER
========================================================= */

const STATUS_LABEL: Record<StatusDonor, string> = {
  berhasil: "Berhasil",
  gagal: "Gagal",
  ditunda: "Ditunda",
};

const STATUS_COLOR: Record<StatusDonor, string> = {
  berhasil: "text-green-600",
  gagal: "text-red-600",
  ditunda: "text-yellow-600",
};

function formatJenisKelamin(nilai: string): string {
  if (nilai === "Laki_laki") return "Laki - Laki";
  return nilai;
}

function formatTanggal(iso?: string | null): string {
  if (!iso) return "-";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "-";
  return t.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTanggalPendek(iso?: string | null): string {
  if (!iso) return "-";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "-";
  const dd = String(t.getDate()).padStart(2, "0");
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${t.getFullYear()}`;
}

function hitungUmur(iso?: string | null): string {
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

  return `${umur}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function DetailRiwayatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<RiwayatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Ubah status */
  const [bukaStatus, setBukaStatus] = useState(false);
  const [ubahLoading, setUbahLoading] = useState(false);
  const wadahStatus = useRef<HTMLDivElement>(null);

  /* Modal darah terkumpul */
  const [bukaDarah, setBukaDarah] = useState(false);
  const [darahInput, setDarahInput] = useState("");
  const [simpanDarah, setSimpanDarah] = useState(false);

  async function ambilDetail() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/web/auth/dashboard/riwayat/${id}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal mengambil detail riwayat"
        );
      }

      setData(result.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ambilDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* Tutup dropdown status saat klik di luar */
  useEffect(() => {
    if (!bukaStatus) return;

    function klikLuar(e: MouseEvent) {
      if (
        wadahStatus.current &&
        !wadahStatus.current.contains(e.target as Node)
      ) {
        setBukaStatus(false);
      }
    }

    document.addEventListener("mousedown", klikLuar);
    return () =>
      document.removeEventListener("mousedown", klikLuar);
  }, [bukaStatus]);

  /* =======================================================
     UBAH STATUS
  ======================================================= */

  async function ubahStatus(status: StatusDonor) {
    try {
      setUbahLoading(true);

      const res = await fetch(
        `/api/web/auth/dashboard/riwayat/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status_donor: status }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal memperbarui status"
        );
      }

      setData((lama) =>
        lama ? { ...lama, status_donor: status } : lama
      );
      setBukaStatus(false);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal memperbarui status"
      );
    } finally {
      setUbahLoading(false);
    }
  }

  /* =======================================================
     DARAH TERKUMPUL
  ======================================================= */

  function bukaModalDarah() {
    setDarahInput(data?.darah_terkumpul?.toString() ?? "");
    setBukaDarah(true);
  }

  async function simpanDarahTerkumpul() {
    if (darahInput === "" || Number.isNaN(Number(darahInput))) {
      alert("Masukkan jumlah darah terkumpul yang valid");
      return;
    }

    try {
      setSimpanDarah(true);

      const res = await fetch(
        `/api/web/auth/dashboard/riwayat/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            darah_terkumpul: Number(darahInput),
          }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal menyimpan data"
        );
      }

      setData((lama) =>
        lama
          ? { ...lama, darah_terkumpul: Number(darahInput) }
          : lama
      );
      setBukaDarah(false);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Gagal menyimpan data"
      );
    } finally {
      setSimpanDarah(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-400">
        Memuat detail riwayat...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error || "Riwayat donor tidak ditemukan"}
        </div>
      </div>
    );
  }

  const p = data.pendonor;

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">

      {/* HEADER */}
      <div className="mb-8 flex items-start justify-between">
        <h1 className="text-[36px] font-bold leading-tight">
          Riwayat Donor
          <br />
          ID {data.id_riwayat}
        </h1>

        <div className="flex items-center gap-3">
          <BackButton
            onClick={() => router.push("/dashboard/riwayat")}
          />

          {/* UBAH STATUS */}
          <div ref={wadahStatus} className="relative">
            <button
              type="button"
              disabled={ubahLoading}
              onClick={() => setBukaStatus((v) => !v)}
              className="flex h-10 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
            >
              Ubah Status
              <ChevronDown
                size={16}
                strokeWidth={3}
                className={`transition-transform ${
                  bukaStatus ? "rotate-180" : ""
                }`}
              />
            </button>

            {bukaStatus && (
              <div className="absolute right-0 top-full z-40 mt-2 w-full overflow-hidden rounded-2xl bg-red-600 shadow-lg">
                <button
                  type="button"
                  onClick={() => ubahStatus("berhasil")}
                  className="block w-full px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Berhasil
                </button>
                <button
                  type="button"
                  onClick={() => ubahStatus("gagal")}
                  className="block w-full px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Gagal
                </button>
                <button
                  type="button"
                  onClick={() => ubahStatus("ditunda")}
                  className="block w-full px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Ditunda
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOTO + DETAIL PENDONOR */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr]">

        {/* FOTO */}
        <div className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          <Image
            src={fotoPendonor(p.foto_profil)}
            alt={p.nama_lengkap}
            fill
            unoptimized
            className="object-cover"
          />
        </div>

        {/* DETAIL PENDONOR */}
        <div>
          <h2 className="mb-6 text-xl font-bold text-gray-900">
            Detail Pendonor
          </h2>

          <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
            <DetailItem label="Nama" value={p.nama_lengkap} />
            <DetailItem label="Email" value={p.email} />
            <DetailItem
              label="Golongan Darah"
              value={p.golongan_darah}
            />

            <DetailItem
              label="Jenis Kelamin"
              value={formatJenisKelamin(p.jenis_kelamin)}
            />
            <DetailItem
              label="Tanggal Lahir"
              value={formatTanggal(p.tanggal_lahir)}
            />
            <DetailItem label="Umur" value={hitungUmur(p.tanggal_lahir)} />
          </div>

          <div className="mt-6">
            <DetailItem label="Alamat" value={p.alamat ?? "-"} />
          </div>
        </div>
      </div>

      <Divider />

      {/* DETAIL DONOR */}
      <h2 className="mb-6 text-xl font-bold text-gray-900">
        Detail Donor
      </h2>

      <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
        <DetailItem
          label="Tanggal Pendonoran"
          value={formatTanggalPendek(data.tanggal_donor)}
        />
        <DetailItem label="Lokasi" value={data.lokasi_donor} />
        <DetailItem
          label="Alamat Lokasi"
          value={data.alamat_lokasi ?? "-"}
        />

        {/* STATUS */}
        <div className="min-w-0">
          <p className="text-sm text-gray-600">Status</p>
          <p
            className={`mt-1 break-words text-lg font-semibold ${STATUS_COLOR[data.status_donor]}`}
          >
            {STATUS_LABEL[data.status_donor]}
          </p>
        </div>

        {/* DARAH TERKUMPUL (bisa diedit) */}
        <div className="min-w-0">
          <button
            type="button"
            onClick={bukaModalDarah}
            className="flex items-center gap-1 text-sm text-gray-600 transition hover:text-red-600"
          >
            Darah Terkumpul
            <ArrowRight size={14} />
          </button>
          <p className="mt-1 break-words text-lg font-semibold text-gray-900">
            {data.darah_terkumpul
              ? `${data.darah_terkumpul}ml`
              : "-"}
          </p>
        </div>
      </div>

      {/* MODAL DARAH TERKUMPUL */}
      {bukaDarah && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setBukaDarah(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-black">
                Darah Terkumpul
              </h3>
              <button
                type="button"
                onClick={() => setBukaDarah(false)}
                className="text-black hover:text-gray-600"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            </div>

            <div className="mb-6 flex items-center overflow-hidden rounded-xl border border-gray-200">
              <input
                type="number"
                min="0"
                value={darahInput}
                onChange={(e) => setDarahInput(e.target.value)}
                autoFocus
                placeholder="Masukkan jumlah"
                className="flex-1 px-5 py-3 text-black outline-none"
              />
              <span className="pr-5 font-semibold text-black">ml</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={simpanDarahTerkumpul}
                disabled={simpanDarah}
                className="flex-1 rounded-xl bg-red-600 py-3 font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-60"
              >
                {simpanDarah ? "Menyimpan..." : "Simpan"}
              </button>
              <button
                type="button"
                onClick={() => setBukaDarah(false)}
                disabled={simpanDarah}
                className="flex-1 rounded-xl border border-gray-200 py-3 font-semibold text-black transition hover:bg-gray-50 disabled:opacity-60"
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
   DIVIDER ANTAR SECTION
   -> disamakan dengan Divider di Lokasi/Jadwal/Pendonor
========================================================= */

function Divider() {
  return <div className="my-9 h-1 w-full rounded-full bg-gray-400" />;
}

/* =========================================================
   DETAIL ITEM
   -> disamakan persis dengan DetailItem di Lokasi/Jadwal/Pendonor
========================================================= */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}