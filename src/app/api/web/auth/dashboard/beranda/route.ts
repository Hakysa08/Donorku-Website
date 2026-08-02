import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id_admin: number;
  email: string;
};

const NAMA_BULAN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const GOLONGAN_DARAH = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

/* =========================================================
   GET DASHBOARD
========================================================= */

export async function GET(req: NextRequest) {
  try {
    /* =====================================================
       1. AUTENTIKASI ADMIN

       Token hanya digunakan untuk mengetahui admin yang
       sedang login.

       Data statistik TIDAK difilter berdasarkan id_admin.
    ===================================================== */

    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Belum login",
        },
        {
          status: 401,
        }
      );
    }

    let decoded: TokenPayload;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as TokenPayload;
    } catch {
      return NextResponse.json(
        {
          message: "Token tidak valid",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       2. DATA ADMIN
    ===================================================== */

    const admin = await prisma.admin.findUnique({
      where: {
        id_admin: decoded.id_admin,
      },

      select: {
        id_admin: true,
        nama_admin: true,
        email: true,
        foto_profil: true,
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          message: "Admin tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       3. RANGE TANGGAL

       Database menggunakan DATE untuk tanggal_donor dan
       tanggal_pelaksanaan.
    ===================================================== */

    const sekarang = new Date();

    const hariIni = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth(),
      sekarang.getDate()
    );

    const besok = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth(),
      sekarang.getDate() + 1
    );

    const awalTahun = new Date(
      sekarang.getFullYear(),
      0,
      1
    );

    const awalTahunDepan = new Date(
      sekarang.getFullYear() + 1,
      0,
      1
    );

    /*
     * "1 bulan terakhir" diartikan sebagai rolling 1 month.
     *
     * Contoh:
     * 31 Juli 2026
     *       ↓
     * 30 Juni/1 Juli tergantung panjang bulan
     *
     * BUKAN "bulan Juli saja".
     */

    const satuBulanLalu = new Date(sekarang);

    satuBulanLalu.setMonth(
      satuBulanLalu.getMonth() - 1
    );

    /* =====================================================
       4. QUERY DATABASE
    ===================================================== */

    const [
      riwayatTahun,
      riwayatHariIni,
      riwayatSebulan,
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

          tanggal_donor: {
            gte: awalTahun,
            lt: awalTahunDepan,
          },
        },

        select: {
          id_riwayat: true,
          id_pendonor: true,
          tanggal_donor: true,
        },
      }),

      /* ===================================================
         PENDONOR HARI INI

         Ambil ID pendonor donor berhasil hari ini.
      =================================================== */

      prisma.riwayatDonor.findMany({
        where: {
          status_donor: "berhasil",

          tanggal_donor: {
            gte: hariIni,
            lt: besok,
          },

          pendonor: {
            is_deleted: false,
          },
        },

        select: {
          id_pendonor: true,
        },
      }),

      /* ===================================================
         PENDONOR 1 BULAN TERAKHIR
      =================================================== */

      prisma.riwayatDonor.findMany({
        where: {
          status_donor: "berhasil",

          tanggal_donor: {
            gte: satuBulanLalu,
            lte: sekarang,
          },

          pendonor: {
            is_deleted: false,
          },
        },

        select: {
          id_pendonor: true,
        },
      }),

      /* ===================================================
         TOTAL STOK DARAH SEMUA CABANG

         Prisma melakukan GROUP BY golongan darah dan SUM
         langsung di database.
      =================================================== */

      prisma.stokDarah.groupBy({
        by: ["golongan_darah"],

        _sum: {
          jumlah_kantong: true,
        },
      }),

      /* ===================================================
         JADWAL DONOR HARI INI

         Status aktif saja.
      =================================================== */

      prisma.jadwalDonor.findMany({
        where: {
          status_jadwal: "aktif",

          tanggal_pelaksanaan: {
            gte: hariIni,
            lt: besok,
          },
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

        orderBy: {
          jam_mulai: "asc",
        },

        take: 4,
      }),

      /* ===================================================
         PENDONOR AKTIF

         Soft deleted tidak dimasukkan ke statistik usia.
      =================================================== */

      prisma.pendonor.findMany({
        where: {
          is_deleted: false,
        },

        select: {
          id_pendonor: true,
          tanggal_lahir: true,
        },
      }),
    ]);

    /* =====================================================
       5. STATISTIK DONOR BULANAN

       1 RiwayatDonor BERHASIL = 1 aktivitas donor.

       Grafik ini menghitung DONASI, bukan jumlah orang unik.
    ===================================================== */

    const donorPerBulan = new Array<number>(12).fill(0);

    for (const riwayat of riwayatTahun) {
      const bulan = riwayat.tanggal_donor.getMonth();

      donorPerBulan[bulan]++;
    }

    const statistikBulanan = NAMA_BULAN.map(
      (bulan, index) => ({
        bulan,
        jumlah: donorPerBulan[index],
      })
    );

    /* =====================================================
       6. TOTAL PENDONOR HARI INI

       Karena label interface adalah "Pendonor", kita hitung
       ORANG UNIK.

       Orang yang sama tidak dihitung dua kali.
    ===================================================== */

    const totalPendonorHariIni = new Set(
      riwayatHariIni.map(
        (riwayat) => riwayat.id_pendonor
      )
    ).size;

    /* =====================================================
       7. TOTAL PENDONOR 1 BULAN TERAKHIR

       Sama: DISTINCT id_pendonor.
    ===================================================== */

    const totalPendonorSebulan = new Set(
      riwayatSebulan.map(
        (riwayat) => riwayat.id_pendonor
      )
    ).size;

    /* =====================================================
       8. TOTAL STOK PER GOLONGAN DARAH
    ===================================================== */

    const ringkasanStok = GOLONGAN_DARAH.map(
      (golonganDarah) => {
        const hasil = stokGroup.find(
          (stok) =>
            stok.golongan_darah === golonganDarah
        );

        const jumlah =
          hasil?._sum.jumlah_kantong ?? 0;

        /*
         * PERHATIAN:
         *
         * Threshold ini hanya untuk visual status.
         * Tidak mempengaruhi jumlah stok.
         *
         * Kalau project punya aturan minimum stok sendiri,
         * ubah threshold ini.
         */

        let status = "Stok aman";

        if (jumlah <= 150) {
          status = "Stok kritis";
        } else if (jumlah <= 300) {
          status = "Stok menipis";
        }

        return {
          golonganDarah,
          jumlah,
          status,
        };
      }
    );

    /* =====================================================
       9. JADWAL DONOR HARI INI
    ===================================================== */

    const donorHariIni = jadwalHariIni.map(
      (jadwal) => ({
        id: jadwal.id_jadwal,

        lokasi:
          jadwal.lokasi.nama_lokasi,

        alamat: [
          jadwal.lokasi.alamat,
          jadwal.lokasi.kota,
        ]
          .filter(Boolean)
          .join(", "),

        tanggal: formatTanggal(
          jadwal.tanggal_pelaksanaan
        ),

        waktu: `${formatJam(
          jadwal.jam_mulai
        )} - ${formatJam(
          jadwal.jam_selesai
        )}`,

        kuota: jadwal.kuota,

        pendonorHadir:
          jadwal.pendonor_hadir ?? 0,
      })
    );

    /* =====================================================
       10. DISTRIBUSI USIA PENDONOR
    ===================================================== */

    const kelompokUsia: Record<string, number> = {
      "17 - 25": 0,
      "26 - 35": 0,
      "36 - 45": 0,
      "46 +": 0,
    };

    for (const pendonor of pendonorAktif) {
      const umur = hitungUmur(
        pendonor.tanggal_lahir,
        sekarang
      );

      /*
       * <17 tidak dimasukkan ke chart karena secara
       * definisi kelompok dashboard dimulai dari 17.
       */

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

    const usiaPendonor = Object.entries(
      kelompokUsia
    ).map(([rentang, jumlah]) => ({
      rentang,
      jumlah,
    }));

    /* =====================================================
       11. RESPONSE FINAL

       page.tsx TIDAK melakukan perhitungan lagi.
       Ia hanya menampilkan object ini.
    ===================================================== */

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
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   HITUNG UMUR
========================================================= */

function hitungUmur(
  tanggalLahir: Date,
  tanggalSekarang: Date
) {
  let umur =
    tanggalSekarang.getFullYear() -
    tanggalLahir.getFullYear();

  const selisihBulan =
    tanggalSekarang.getMonth() -
    tanggalLahir.getMonth();

  if (
    selisihBulan < 0 ||
    (selisihBulan === 0 &&
      tanggalSekarang.getDate() <
        tanggalLahir.getDate())
  ) {
    umur--;
  }

  return umur;
}

/* =========================================================
   FORMAT TANGGAL
========================================================= */

function formatTanggal(
  tanggal: Date | null
) {
  if (!tanggal) {
    return "-";
  }

  return tanggal.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* =========================================================
   FORMAT JAM
========================================================= */

function formatJam(jam: Date) {
  return jam.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}