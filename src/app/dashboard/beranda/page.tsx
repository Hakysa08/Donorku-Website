"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Clock,
  MapPin,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type DashboardData = {
  admin: {
    id_admin: number;
    nama_admin: string;
    email: string;
    foto_profil: string | null;
  };

  statistikBulanan: {
    bulan: string;
    jumlah: number;
  }[];

  ringkasanStok: {
    golonganDarah: string;
    jumlah: number;
    status: string;
  }[];

  donorHariIni: {
    id: number;
    lokasi: string;
    alamat: string;
    tanggal: string;
    waktu: string;
  }[];

  totalPendonorHariIni: number;
  totalPendonorSebulan: number;

  usiaPendonor: {
    rentang: string;
    jumlah: number;
  }[];
};

/* =========================================================
   KONSTANTA
========================================================= */

const WARNA_DONUT = [
  "#F49A9A",
  "#EF7474",
  "#F15454",
  "#F22626",
];

/* =========================================================
   ICON GOLONGAN DARAH
========================================================= */

const GOLONGAN_TERSEDIA = [
  "a+", "a-", "b+", "b-",
  "ab+", "ab-", "o+", "o-",
];

function ikonStok(golongan: string, putih: boolean): string {
  const g = golongan.trim().toLowerCase();
  const nama = GOLONGAN_TERSEDIA.includes(g) ? g : "o+";
  return `/tipe-darah/blood_${nama}${putih ? "_wh" : ""}.png`;
}

/* =========================================================
   KARTU STOK DARAH
========================================================= */

function KartuStok({
  golonganDarah,
  jumlah,
  status,
}: {
  golonganDarah: string;
  jumlah: number;
  status: string;
}) {
  const aktif = status !== "Stok aman";

  return (
    <div
      className={`flex min-h-[78px] items-center gap-3 rounded-xl border px-4 py-3 ${
        aktif
          ? "border-red-500 bg-red-500 text-white"
          : "border-gray-200 bg-white text-gray-900"
      }`}
    >
      <img
        src={ikonStok(golonganDarah, aktif)}
        alt={golonganDarah}
        className="h-12 w-12 shrink-0 object-contain"
      />

      <div className="min-w-0 flex-1">
        <p className="whitespace-nowrap text-[22px] font-bold leading-none">
          {jumlah}

          <span className="ml-1 text-[12px] font-normal">
            kantong
          </span>
        </p>

        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
              aktif ? "bg-white" : "bg-gray-900"
            }`}
          />

          <span className="text-[12px]">
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TOMBOL LIHAT SEMUA
========================================================= */

function TombolLihatSemua({
  href,
}: {
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-red-500 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-red-600"
    >
      Lihat Semua

      <img src="/button/seeall.png" alt="Lihat Semua" className="h-3.5 w-3.5" />
    </Link>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function BerandaPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     FETCH DASHBOARD
  ======================================================= */

  useEffect(() => {
    async function ambilDashboard() {
      try {
        const response = await fetch(
          "/api/web/auth/dashboard/beranda",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const contentType =
          response.headers.get("content-type");

        if (
          !contentType?.includes(
            "application/json"
          )
        ) {
          throw new Error(
            `API tidak mengembalikan JSON (${response.status})`
          );
        }

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              `HTTP Error ${response.status}`
          );
        }

        setData(result.data);
      } catch (err) {
        console.error(
          "Dashboard Fetch Error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan"
        );
      } finally {
        setLoading(false);
      }
    }

    ambilDashboard();
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />

          <p className="mt-3 text-sm text-gray-400">
            Memuat Beranda...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !data) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-5 text-center">
          <p className="font-semibold text-red-500">
            Dashboard gagal dimuat
          </p>

          <p className="mt-1 text-xs text-red-400">
            {error ||
              "Data dashboard tidak ditemukan"}
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     DATA
  ======================================================= */

  const {
    admin,
    statistikBulanan,
    ringkasanStok,
    donorHariIni,
    totalPendonorHariIni,
    totalPendonorSebulan,
    usiaPendonor,
  } = data;

  const namaAdmin =
    admin.nama_admin
      ?.trim()
      .split(" ")[0] || "Admin";

  const tanggalHariIni =
    donorHariIni.length > 0
      ? donorHariIni[0].tanggal
      : new Date().toLocaleDateString(
          "id-ID",
          {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          }
        );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="mb-6">
        <h1 className="text-[36px] font-bold tracking-tight text-black">
          Beranda
        </h1>

        <p className="mt-1 text-[16px] font-semibold text-black">
          Welcome, {namaAdmin}
        </p>
      </div>

      {/* ===================================================
          DASHBOARD GRID
      =================================================== */}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">

        {/* =================================================
            STATISTIK
        ================================================= */}

        <section className="min-h-[330px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-gray-900">
              Statistik
            </h2>

            <div className="flex items-center gap-1.5 text-[12px] text-gray-900">
              <span className="h-2 w-2 rounded-full bg-gray-900" />

              <span>Donor</span>
            </div>
          </div>

          <div className="mt-3 h-[250px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={statistikBulanan}
                margin={{
                  top: 10,
                  right: 10,
                  bottom: 0,
                  left: -8,
                }}
              >
                <CartesianGrid
                  stroke="#eeeeee"
                  vertical={false}
                />

                <XAxis
                  dataKey="bulan"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: "#777777",
                  }}
                  dy={8}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={45}
                  tick={{
                    fontSize: 11,
                    fill: "#888888",
                  }}
                />

                <Tooltip
                  cursor={{
                    stroke: "#eeeeee",
                  }}
                  contentStyle={{
                    border:
                      "1px solid #eeeeee",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [
                    `${value} donor`,
                    "Jumlah",
                  ]}
                />

                <Line
                  type="linear"
                  dataKey="jumlah"
                  stroke="#FF2B31"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* =================================================
            TOTAL STOK DARAH
        ================================================= */}

        <section className="min-h-[330px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-7">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[16px] font-semibold text-gray-900">
              Total Stok Darah Dari Semua Cabang
            </h2>

            <TombolLihatSemua href="/dashboard/stok-darah" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ringkasanStok.map(
              (item) => (
                <KartuStok
                  key={
                    item.golonganDarah
                  }
                  {...item}
                />
              )
            )}
          </div>
        </section>

        {/* =================================================
            DONOR HARI INI
        ================================================= */}

        <section className="min-h-[320px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-gray-900">
              Donor Hari Ini
            </h2>

            <div className="flex items-center gap-4">
              <span className="hidden text-[12px] text-gray-400 sm:block">
                {tanggalHariIni}
              </span>

              <TombolLihatSemua href="/dashboard/jadwaldonor" />
            </div>
          </div>

          {donorHariIni.length ===
          0 ? (
            <div className="mt-5 flex h-[200px] items-center justify-center rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-400">
                Tidak ada jadwal donor
                hari ini
              </p>
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {donorHariIni.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex min-h-[115px] overflow-hidden rounded-xl border border-gray-200 bg-white"
                  >
                    {/* CONTENT */}

                    <div className="min-w-0 flex-1 p-4">
                      <p className="text-[13px] font-semibold text-gray-900">
                        Donor Hari Ini
                      </p>

                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {item.tanggal}
                      </p>

                      <p className="mt-3 truncate text-[14px] font-medium text-gray-900">
                        {item.lokasi}
                      </p>

                      <div className="mt-1.5 flex min-w-0 items-center gap-1 text-[11px] text-gray-500">
                        <MapPin className="h-3 w-3 shrink-0" />

                        <span className="truncate">
                          {item.alamat}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                        <Clock className="h-3 w-3 shrink-0" />

                        <span>
                          {item.waktu}
                        </span>
                      </div>
                    </div>

                    {/* RED DECORATION */}

                    <div
                      className="w-[52px] shrink-0 bg-red-500"
                      aria-hidden="true"
                    />
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* =================================================
            TOTAL PENDONOR
        ================================================= */}

        <div className="flex flex-col gap-5 xl:col-span-3">
          {/* HARI INI */}

          <section className="flex min-h-[150px] flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[15px] font-semibold text-gray-900">
              Total Pendonor Hari ini
            </p>

            <p className="mt-3 text-[52px] font-bold leading-none text-red-500">
              {totalPendonorHariIni}
            </p>

            <p className="mt-2 text-[13px] text-gray-900">
              Orang
            </p>
          </section>

          {/* BULAN TERAKHIR */}

          <section className="flex min-h-[150px] flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[15px] font-semibold text-gray-900">
              Total Pendonor 1 Bulan
              Terakhir
            </p>

            <p className="mt-3 text-[52px] font-bold leading-none text-red-500">
              {totalPendonorSebulan}
            </p>

            <p className="mt-2 text-[13px] text-gray-900">
              Orang
            </p>
          </section>
        </div>

        {/* =================================================
            USIA PENDONOR
        ================================================= */}

        <section className="min-h-[320px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h2 className="text-[16px] font-semibold text-gray-900">
            Usia Pendonor
          </h2>

          {/* DONUT */}

          <div className="h-[195px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Pie
                  data={usiaPendonor}
                  dataKey="jumlah"
                  nameKey="rentang"
                  cx="50%"
                  cy="52%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="none"
                >
                  {usiaPendonor.map(
                    (_, index) => (
                      <Cell
                        key={index}
                        fill={
                          WARNA_DONUT[
                            index %
                              WARNA_DONUT.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip
                  contentStyle={{
                    border:
                      "1px solid #eeeeee",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [
                    `${value} orang`,
                    "Pendonor",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* LEGEND */}

          <ul className="mt-1 space-y-2">
            {usiaPendonor.map(
              (item, index) => (
                <li
                  key={item.rentang}
                  className="flex items-center text-[13px] text-gray-900"
                >
                  <span
                    className="mr-2 h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        WARNA_DONUT[
                          index %
                            WARNA_DONUT.length
                        ],
                    }}
                  />

                  <span>
                    {item.rentang}
                  </span>

                  <span className="ml-auto text-gray-400">
                    {item.jumlah}
                  </span>
                </li>
              )
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}