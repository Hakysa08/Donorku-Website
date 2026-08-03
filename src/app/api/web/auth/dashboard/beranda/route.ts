import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id_admin: number;
  email: string;
};

const NAMA_BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const GOLONGAN_DARAH = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
];

function getTanggalJakarta(acuan: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(acuan);

  const tahun = Number(parts.find((p) => p.type === "year")?.value);
  const bulan = Number(parts.find((p) => p.type === "month")?.value);
  const hari = Number(parts.find((p) => p.type === "day")?.value);

  return { tahun, bulan, hari };
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Belum login" }, { status: 401 });
    }

    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch {
      return NextResponse.json({ message: "Token tidak valid" }, { status: 401 });
    }

    const admin = await prisma.admin.findUnique({
      where: { id_admin: decoded.id_admin },
      select: {
        id_admin: true,
        nama_admin: true,
        email: true,
        foto_profil: true,
      },
    });

    if (!admin) {
      return NextResponse.json({ message: "Admin tidak ditemukan" }, { status: 404 });
    }

    const sekarang = new Date();
    const { tahun, bulan, hari } = getTanggalJakarta(sekarang);

    const hariIni = new Date(Date.UTC(tahun, bulan - 1, hari));
    const besok = new Date(Date.UTC(tahun, bulan - 1, hari + 1));
    const awalTahun = new Date(Date.UTC(tahun, 0, 1));
    const awalTahunDepan = new Date(Date.UTC(tahun + 1, 0, 1));

    const satuBulanLaluDate = new Date(Date.UTC(tahun, bulan - 1, hari));
    satuBulanLaluDate.setUTCMonth(satuBulanLaluDate.getUTCMonth() - 1);

    const [
      riwayatTahun,
      pendaftaranHariIni,
      pendaftaranSebulan,
      stokGroup,
      jadwalHariIni,
      pendonorAktif,
    ] = await Promise.all([
      /* ===================================================
         STATISTIK DONOR TAHUN INI
         Hanya donor BERHASIL.
      =================================================== */
      prisma.riwayatDonor.findMany({
        where: {
          status_donor: "berhasil",
          tanggal_donor: { gte: awalTahun, lt: awalTahunDepan },
        },
        select: {
          id_riwayat: true,
          id_pendonor: true,
          tanggal_donor: true,
        },
      }),

      /* ===================================================
         PENDONOR HARI INI

         Diambil dari Pendaftaran, berdasarkan tanggal
         pelaksanaan jadwal (versi WIB). Pendaftaran yang
         dibatalkan/ditolak tidak dihitung.
      =================================================== */
      prisma.pendaftaran.findMany({
        where: {
          jadwal: {
            tanggal_pelaksanaan: { gte: hariIni, lt: besok },
          },
          status_pendaftaran: {
            notIn: ["dibatalkan", "ditolak"],
          },
          pendonor: { is_deleted: false },
        },
        select: { id_pendonor: true },
      }),

      /* ===================================================
         PENDONOR 1 BULAN TERAKHIR

         Diambil dari Pendaftaran, konsisten dengan
         "Pendonor Hari Ini". Pendaftaran yang
         dibatalkan/ditolak tidak dihitung.
      =================================================== */
      prisma.pendaftaran.findMany({
        where: {
          jadwal: {
            tanggal_pelaksanaan: { gte: satuBulanLaluDate, lt: besok },
          },
          status_pendaftaran: {
            notIn: ["dibatalkan", "ditolak"],
          },
          pendonor: { is_deleted: false },
        },
        select: { id_pendonor: true },
      }),

      /* ===================================================
         TOTAL STOK DARAH SEMUA CABANG
      =================================================== */
      prisma.stokDarah.groupBy({
        by: ["golongan_darah"],
        _sum: { jumlah_kantong: true },
      }),

      /* ===================================================
         JADWAL DONOR HARI INI
      =================================================== */
      prisma.jadwalDonor.findMany({
        where: {
          status_jadwal: "aktif",
          tanggal_pelaksanaan: { gte: hariIni, lt: besok },
        },
        select: {
          id_jadwal: true,
          tanggal_pelaksanaan: true,
          jam_mulai: true,
          jam_selesai: true,
          kuota: true,
          pendonor_hadir: true,
          lokasi: {
            select: {
              nama_lokasi: true,
              alamat: true,
              kota: true,
            },
          },
        },
        orderBy: { jam_mulai: "asc" },
        take: 4,
      }),

      /* ===================================================
         PENDONOR AKTIF
      =================================================== */
      prisma.pendonor.findMany({
        where: { is_deleted: false },
        select: { id_pendonor: true, tanggal_lahir: true },
      }),
    ]);

    /* =====================================================
       STATISTIK DONOR BULANAN
    ===================================================== */
    const donorPerBulan = new Array<number>(12).fill(0);

    for (const riwayat of riwayatTahun) {
      const bulanRiwayat = riwayat.tanggal_donor.getUTCMonth();
      donorPerBulan[bulanRiwayat]++;
    }

    const statistikBulanan = NAMA_BULAN.map((bulanNama, index) => ({
      bulan: bulanNama,
      jumlah: donorPerBulan[index],
    }));

    /* =====================================================
       TOTAL PENDONOR HARI INI
    ===================================================== */
    const totalPendonorHariIni = new Set(
      pendaftaranHariIni.map((pendaftaran) => pendaftaran.id_pendonor)
    ).size;

    /* =====================================================
       TOTAL PENDONOR 1 BULAN TERAKHIR
    ===================================================== */
    const totalPendonorSebulan = new Set(
      pendaftaranSebulan.map((pendaftaran) => pendaftaran.id_pendonor)
    ).size;

    /* =====================================================
       TOTAL STOK PER GOLONGAN DARAH
    ===================================================== */
    const ringkasanStok = GOLONGAN_DARAH.map((golonganDarah) => {
      const hasil = stokGroup.find((stok) => stok.golongan_darah === golonganDarah);
      const jumlah = hasil?._sum.jumlah_kantong ?? 0;

      let status = "Stok aman";

      if (jumlah <= 1000) {
        status = "Stok kritis";
      } else if (jumlah <= 2500) {
        status = "Stok menipis";
      }

      return { golonganDarah, jumlah, status };
    });

    /* =====================================================
       JADWAL DONOR HARI INI
    ===================================================== */
    const donorHariIni = jadwalHariIni.map((jadwal) => ({
      id: jadwal.id_jadwal,
      lokasi: jadwal.lokasi.nama_lokasi,
      alamat: [jadwal.lokasi.alamat, jadwal.lokasi.kota].filter(Boolean).join(", "),
      tanggal: formatTanggal(jadwal.tanggal_pelaksanaan),
      waktu: `${formatJam(jadwal.jam_mulai)} - ${formatJam(jadwal.jam_selesai)}`,
      kuota: jadwal.kuota,
      pendonorHadir: jadwal.pendonor_hadir ?? 0,
    }));

    /* =====================================================
       DISTRIBUSI USIA PENDONOR
    ===================================================== */
    const kelompokUsia: Record<string, number> = {
      "17 - 25": 0,
      "26 - 35": 0,
      "36 - 45": 0,
      "46 +": 0,
    };

    for (const pendonor of pendonorAktif) {
      const umur = hitungUmur(pendonor.tanggal_lahir, sekarang);

      if (umur >= 17 && umur <= 25) {
        kelompokUsia["17 - 25"]++;
      } else if (umur >= 26 && umur <= 35) {
        kelompokUsia["26 - 35"]++;
      } else if (umur >= 36 && umur <= 45) {
        kelompokUsia["36 - 45"]++;
      } else if (umur >= 46) {
        kelompokUsia["46 +"]++;
      }
    }

    const usiaPendonor = Object.entries(kelompokUsia).map(([rentang, jumlah]) => ({
      rentang,
      jumlah,
    }));

    return NextResponse.json({
      message: "Data dashboard berhasil diambil",
      data: {
        admin,
        statistikBulanan,
        ringkasanStok,
        donorHariIni,
        totalPendonorHariIni,
        totalPendonorSebulan,
        usiaPendonor,
      },
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil data dashboard",
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

function hitungUmur(tanggalLahir: Date, tanggalSekarang: Date) {
  let umur = tanggalSekarang.getFullYear() - tanggalLahir.getFullYear();
  const selisihBulan = tanggalSekarang.getMonth() - tanggalLahir.getMonth();

  if (
    selisihBulan < 0 ||
    (selisihBulan === 0 && tanggalSekarang.getDate() < tanggalLahir.getDate())
  ) {
    umur--;
  }

  return umur;
}

function formatTanggal(tanggal: Date | null) {
  if (!tanggal) return "-";

  return tanggal.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatJam(jam: Date) {
  return jam.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}