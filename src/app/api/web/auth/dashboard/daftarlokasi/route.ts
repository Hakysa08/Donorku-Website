import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

type TokenPayload = {
  id_admin: number;
  email: string;
};

const GOLONGAN_DARAH = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/* =========================================================
   VERIFY TOKEN
========================================================= */

function verifyToken(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as TokenPayload;
  } catch {
    return null;
  }
}

/* =========================================================
   GET
   LIST DAFTAR LOKASI

   GET /api/web/auth/dashboard/daftarlokasi

   Query:
   ?page=1
   &limit=8
   &search=PMI
   &tanggal=2026-07-31
========================================================= */

export async function GET(req: NextRequest) {
  try {
    /* =====================================================
       AUTH
    ===================================================== */

    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    /* =====================================================
       QUERY PARAMETER
    ===================================================== */

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() ?? "";

    const tanggal = searchParams.get("tanggal") ?? "";

    const pageRaw = Number(searchParams.get("page") ?? "1");

    const limitRaw = Number(searchParams.get("limit") ?? "8");

    /* =====================================================
       VALIDASI PAGE
    ===================================================== */

    const page =
      Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    /* =====================================================
       VALIDASI LIMIT
    ===================================================== */

    const limit =
      Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 50
        ? limitRaw
        : 8;

    /* =====================================================
       FILTER
    ===================================================== */

    const AND: Prisma.LokasiDonorWhereInput[] = [];

    /* =====================================================
       SEARCH

       Search akan mencari:
       - nama lokasi
       - alamat
       - kota
       - nomor HP petugas
    ===================================================== */

    if (search) {
      AND.push({
        OR: [
          {
            nama_lokasi: {
              contains: search,
            },
          },

          {
            alamat: {
              contains: search,
            },
          },

          {
            kota: {
              contains: search,
            },
          },

          {
            no_hp: {
              contains: search,
            },
          },
        ],
      });
    }

    /* =====================================================
       FILTER TANGGAL

       LokasiDonor tidak memiliki field tanggal.

       Jadi:
       tanggal yang dipilih
              ↓
       cari JadwalDonor
              ↓
       cari lokasi yang mempunyai jadwal
       pada tanggal tersebut
    ===================================================== */

    if (tanggal) {
      /*
       * Format yang diterima:
       *
       * YYYY-MM-DD
       *
       * contoh:
       * 2026-07-31
       */

      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal);

      if (!match) {
        return NextResponse.json(
          {
            message: "Format tanggal tidak valid",
          },
          {
            status: 400,
          }
        );
      }

      const tahun = Number(match[1]);
      const bulan = Number(match[2]);
      const hari = Number(match[3]);

      /*
       * Validasi tanggal.
       */

      const validasiTanggal = new Date(tahun, bulan - 1, hari);

      if (
        validasiTanggal.getFullYear() !== tahun ||
        validasiTanggal.getMonth() !== bulan - 1 ||
        validasiTanggal.getDate() !== hari
      ) {
        return NextResponse.json(
          {
            message: "Tanggal tidak valid",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Range satu hari:
       *
       * >= 2026-07-31 00:00
       * <  2026-08-01 00:00
       */

      const awalHari = new Date(tahun, bulan - 1, hari);

      const akhirHari = new Date(tahun, bulan - 1, hari + 1);

      AND.push({
        jadwal_donor: {
          some: {
            tanggal_pelaksanaan: {
              gte: awalHari,
              lt: akhirHari,
            },
          },
        },
      });
    }

    /* =====================================================
       FINAL WHERE
    ===================================================== */

    const where: Prisma.LokasiDonorWhereInput =
      AND.length > 0
        ? {
            AND,
          }
        : {};

    /* =====================================================
       QUERY DATABASE

       Count dan data dijalankan bersamaan.
    ===================================================== */

    const [total, lokasi] = await Promise.all([
      /* ===================================================
         TOTAL DATA
      =================================================== */

      prisma.lokasiDonor.count({
        where,
      }),

      /* ===================================================
         DATA LOKASI
      =================================================== */

      prisma.lokasiDonor.findMany({
        where,

        select: {
          id_lokasi: true,
          nama_lokasi: true,
          alamat: true,
          kota: true,

          /*
           * Schema Prisma kamu menggunakan no_hp,
           * BUKAN no_petugas.
           */
          no_hp: true,

          longitude: true,
          latitude: true,
        },

        orderBy: {
          id_lokasi: "asc",
        },

        skip: (page - 1) * limit,

        take: limit,
      }),
    ]);

    /* =====================================================
       PAGINATION
    ===================================================== */

    const totalPages = Math.max(1, Math.ceil(total / limit));

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      message: "Data lokasi berhasil diambil",

      data: lokasi,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("GET LOKASI ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil data lokasi",

        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   POST
   TAMBAH LOKASI

   POST /api/web/auth/dashboard/daftarlokasi

   Setelah lokasi berhasil dibuat, otomatis generate 8 baris
   stok_darah (satu per golongan darah, jumlah_kantong: 0).
   Dibungkus $transaction supaya kalau salah satu langkah
   gagal, dua-duanya dibatalkan (tidak ada lokasi "yatim"
   tanpa stok).
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    /* =====================================================
       AMBIL FORMDATA
    ===================================================== */

    const formData = await req.formData();

    const nama_lokasi = String(formData.get("nama_lokasi") ?? "").trim();

    const alamat = String(formData.get("alamat") ?? "").trim();

    const kota = String(formData.get("kota") ?? "").trim();

    const no_hp = String(formData.get("no_hp") ?? "").trim();

    const longitudeRaw = String(formData.get("longitude") ?? "").trim();

    const latitudeRaw = String(formData.get("latitude") ?? "").trim();

    const foto = formData.get("foto");

    /* =====================================================
       VALIDASI
    ===================================================== */

    if (!nama_lokasi || !alamat || !kota || !no_hp) {
      return NextResponse.json(
        {
          message: "Nama lokasi, alamat, kota, dan nomor HP wajib diisi",
        },
        { status: 400 }
      );
    }

    if (!longitudeRaw || !latitudeRaw) {
      return NextResponse.json(
        {
          message: "Longitude dan latitude wajib diisi",
        },
        { status: 400 }
      );
    }

    const longitude = Number(longitudeRaw);
    const latitude = Number(latitudeRaw);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return NextResponse.json(
        {
          message: "Longitude dan latitude harus berupa angka",
        },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          message: "Longitude harus berada antara -180 sampai 180",
        },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          message: "Latitude harus berada antara -90 sampai 90",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VALIDASI FOTO
    ===================================================== */

    let fotoFile: File | null = null;

    if (foto instanceof File && foto.size > 0) {
      if (foto.type !== "image/jpeg" && foto.type !== "image/jpg") {
        return NextResponse.json(
          {
            message: "Foto lokasi harus berformat JPG/JPEG",
          },
          { status: 400 }
        );
      }

      // Maksimal 5 MB
      if (foto.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            message: "Ukuran foto maksimal 5 MB",
          },
          { status: 400 }
        );
      }

      fotoFile = foto;
    }

    /* =====================================================
       INSERT LOKASI + AUTO-GENERATE STOK DARAH
       (dibungkus transaction)
    ===================================================== */

    const lokasi = await prisma.$transaction(async (tx) => {
      const lokasiBaru = await tx.lokasiDonor.create({
        data: {
          id_admin: admin.id_admin,
          nama_lokasi,
          alamat,
          kota,
          no_hp,
          longitude,
          latitude,
        },

        select: {
          id_lokasi: true,
          nama_lokasi: true,
          alamat: true,
          kota: true,
          no_hp: true,
          longitude: true,
          latitude: true,
        },
      });

      await tx.stokDarah.createMany({
        data: GOLONGAN_DARAH.map((golongan) => ({
          id_admin: admin.id_admin,
          id_lokasi: lokasiBaru.id_lokasi,
          golongan_darah: golongan,
          jumlah_kantong: 0,
        })),
      });

      return lokasiBaru;
    });

    /* =====================================================
       SIMPAN FOTO

       ID database digunakan sebagai nama file:
       1101.jpg
       1102.jpg
       dst.
    ===================================================== */

    if (fotoFile) {
      const fs = await import("fs/promises");
      const path = await import("path");

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "lokasi"
      );

      await fs.mkdir(uploadDir, {
        recursive: true,
      });

      const bytes = await fotoFile.arrayBuffer();

      const buffer = Buffer.from(bytes);

      const filePath = path.join(uploadDir, `${lokasi.id_lokasi}.jpg`);

      await fs.writeFile(filePath, buffer);
    }

    return NextResponse.json(
      {
        message: "Lokasi berhasil ditambahkan",

        data: lokasi,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE LOKASI ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal menambahkan lokasi",

        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}