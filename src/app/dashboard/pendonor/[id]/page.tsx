"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { ChevronDown, X } from "lucide-react";

import BackButton from "@/components/BackButton";
import { ikonGolongan } from "@/lib/golonganDarah";
import { fotoPendonor } from "@/lib/fotoPendonor";

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

type Kuesioner = {
  demam_flu_batuk: boolean;
  sehat_hari_ini: boolean;
  pernah_dirawat: boolean;
  sudah_makan: boolean;
  konsumsi_alkohol: boolean;
  konsumsi_obat: boolean;
  pernah_pingsan_donor: boolean;
  riwayat_jantung_diabetes: boolean;
  riwayat_hepatitis_hiv: boolean;
  hamil_menyusui: boolean;
  baru_operasi: boolean;
  baru_vaksin: boolean;
  bersedia_sukarela: boolean;
};

type Detail = {
  id_pendaftaran: number;
  nomor_antrian: number;
  tanggal_daftar: string;
  status: StatusPendaftaran;
  pendonor: {
    id_pendonor: number;
    nik: string;
    nama_lengkap: string;
    jenis_kelamin: string;
    tanggal_lahir: string;
    alamat: string | null;
    kota: string | null;
    profesi: string | null;
    no_hp: string | null;
    email: string;
    golongan_darah: string;
    foto_profil: string | null;
  };
  tanggal_pendonoran: string;
  lokasi: string;
  alamat_lokasi: string | null;
  kota_lokasi: string | null;
  kuesioner: Kuesioner | null;
};

/* =========================================================
   HELPER
========================================================= */

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

const STATUS_LABEL: Record<StatusPendaftaran, string> = {
  menunggu: "Menunggu",
  diterima: "Diterima",
  ditolak: "Ditolak",
  dibatalkan: "Dibatalkan",
  selesai: "Selesai",
  batal_hadir: "Batal Hadir",
};

/* Daftar pertanyaan kuesioner (urutan sesuai desain) */
const PERTANYAAN: { key: keyof Kuesioner; teks: string }[] = [
  { key: "demam_flu_batuk", teks: "Apakah Anda sedang demam, flu, batuk, atau sakit?" },
  { key: "sehat_hari_ini", teks: "Apakah Anda merasa sehat hari ini?" },
  { key: "pernah_dirawat", teks: "Apakah pernah dirawat di rumah sakit?" },
  { key: "sudah_makan", teks: "Apakah Anda sudah makan dalam 3-4 jam terakhir?" },
  { key: "konsumsi_alkohol", teks: "Apakah Anda mengonsumsi alkohol dalam 24 jam terakhir?" },
  { key: "konsumsi_obat", teks: "Apakah Anda sedang mengonsumsi obat-obatan tertentu?" },
  { key: "pernah_pingsan_donor", teks: "Apakah Anda pernah pingsan atau pusing saat donor darah sebelumnya?" },
  { key: "riwayat_jantung_diabetes", teks: "Apakah Anda memiliki riwayat penyakit jantung, tekanan darah, atau diabetes?" },
  { key: "riwayat_hepatitis_hiv", teks: "Apakah Anda pernah didiagnosis hepatitis, HIV/AIDS, atau penyakit menular darah?" },
  { key: "hamil_menyusui", teks: "Apakah Anda sedang hamil atau menyusui? (untuk wanita)" },
  { key: "baru_operasi", teks: "Apakah Anda baru menjalani operasi, atau tindakan medis dalam 6 bulan terakhir?" },
  { key: "baru_vaksin", teks: "Apakah Anda baru menerima vaksinasi dalam 1 bulan terakhir?" },
  { key: "bersedia_sukarela", teks: "Apakah Anda bersedia mendonorkan darah secara sukarela tanpa paksaan?" },
];

/* =========================================================
   PAGE
========================================================= */

export default function DetailPendonorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [bukaStatus, setBukaStatus] = useState(false);
  const [ubahLoading, setUbahLoading] = useState(false);
  const [bukaKuesioner, setBukaKuesioner] = useState(false);

  const wadahStatus = useRef<HTMLDivElement>(null);

  /* =======================================================
     FETCH DETAIL
  ======================================================= */

  async function ambilDetail() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/web/auth/dashboard/pendonor/${id}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal mengambil detail pendonor"
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

  /* TUTUP DROPDOWN STATUS SAAT KLIK DI LUAR */
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

  async function ubahStatus(status: StatusPendaftaran) {
    try {
      setUbahLoading(true);

      const res = await fetch(
        `/api/web/auth/dashboard/pendonor/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(
          result.message || "Gagal memperbarui status"
        );
      }

      setData((lama) =>
        lama ? { ...lama, status } : lama
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
     STATE TAMPILAN
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-400">
        Memuat detail pendonor...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full px-10 py-7">
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error || "Pendonor tidak ditemukan"}
        </div>
      </div>
    );
  }

  const p = data.pendonor;

  return (
    <div className="w-full px-6 pb-12 pt-6 text-black">

      {/* HEADER */}
      <div className="mb-8 flex items-start justify-between">
        <h1 className="text-[32px] font-bold leading-tight">
          Daftar Pendonor
          <br />
          ID {data.id_pendaftaran}
        </h1>

        <div className="flex items-center gap-3">
          {/* KEMBALI */}
          <BackButton
            onClick={() => router.push("/dashboard/pendonor")}
          />

          {/* UBAH STATUS */}
          <div ref={wadahStatus} className="relative">
            <button
              type="button"
              disabled={ubahLoading}
              onClick={() => setBukaStatus((v) => !v)}
              className="flex h-10 items-center gap-2 rounded-full bg-[#EC2727] px-5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              Ubah Status
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  bukaStatus ? "rotate-180" : ""
                }`}
                strokeWidth={3}
              />
            </button>

            {bukaStatus && (
              <div className="absolute right-0 top-full z-40 mt-2 w-full overflow-hidden rounded-2xl bg-[#EC2727] shadow-lg">
                <button
                  type="button"
                  onClick={() => ubahStatus("diterima")}
                  className="block w-full px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Diterima
                </button>
                <button
                  type="button"
                  onClick={() => ubahStatus("ditolak")}
                  className="block w-full px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Ditolak
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KARTU PROFIL + DETAIL PENDONOR */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[300px_1fr]">

        {/* FOTO */}
        <div className="relative h-[280px] w-full overflow-hidden rounded-2xl border border-black bg-gray-50">
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
          <div className="mb-6 flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Detail Pendonor
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              <Image
                src={ikonGolongan(p.golongan_darah)}
                alt=""
                width={14}
                height={14}
                className="object-contain"
              />
              {p.golongan_darah}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
            <DetailItem label="Nama" value={p.nama_lengkap} />
            <DetailItem label="Email" value={p.email} />
            <DetailItem label="Golongan Darah" value={p.golongan_darah} />

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

      {/* DIVIDER (tebal, hitam) */}
      <hr className="my-8 border-t-2 border-black" />

      {/* DETAIL DONOR */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Detail Donor</h2>

        <button
          type="button"
          onClick={() => setBukaKuesioner(true)}
          className="flex h-10 items-center gap-2 rounded-full border border-black bg-white px-4 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
        >
          Hasil Kuesioner
        </button>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
        <DetailItem
          label="Tanggal Pendonoran"
          value={formatTanggalPendek(data.tanggal_pendonoran)}
        />
        <DetailItem label="Lokasi" value={data.lokasi} />
        <DetailItem label="Alamat Lokasi" value={data.alamat_lokasi ?? "-"} />

        <DetailItem label="Status" value={STATUS_LABEL[data.status]} />
        <DetailItem label="No Antrian" value={`${data.nomor_antrian}`} />
      </div>

      {/* MODAL HASIL KUESIONER */}
      {bukaKuesioner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setBukaKuesioner(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-8 pt-7">
              <h3 className="text-2xl font-bold text-black">
                Hasil Kuesioner
              </h3>
              <button
                type="button"
                onClick={() => setBukaKuesioner(false)}
                className="text-black hover:text-gray-600"
              >
                <X className="h-6 w-6" strokeWidth={2.5} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto px-8 py-6">
              {!data.kuesioner ? (
                <p className="py-10 text-center text-sm text-gray-400">
                  Pendonor ini belum mengisi kuesioner kesehatan.
                </p>
              ) : (
                PERTANYAAN.map((q) => {
                  const jawab = Boolean(
                    data.kuesioner?.[q.key]
                  );
                  return (
                    <div
                      key={q.key}
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3"
                    >
                      <p className="text-sm text-gray-800">{q.teks}</p>
                      <div className="flex shrink-0 items-center gap-4">
                        <Pilihan label="Ya" aktif={jawab} />
                        <Pilihan label="Tidak" aktif={!jawab} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DETAIL ITEM
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
      <p className="mb-1 text-sm text-gray-400">{label}</p>
      <p className="break-words text-lg font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   PILIHAN RADIO (read-only)
========================================================= */

function Pilihan({
  label,
  aktif,
}: {
  label: string;
  aktif: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
          aktif ? "border-[#EC2727]" : "border-gray-300"
        }`}
      >
        {aktif && (
          <span className="h-2 w-2 rounded-full bg-[#EC2727]" />
        )}
      </span>
      <span className="text-xs text-gray-600">{label}</span>
    </span>
  );
}
