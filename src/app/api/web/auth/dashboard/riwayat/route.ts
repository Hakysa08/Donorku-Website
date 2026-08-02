import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

type TokenPayload = {
  id_admin: number;
  email: string;
};

function verifyToken(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

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
   GET  LIST RIWAYAT DONOR

   GET /api/web/auth/dashboard/riwayat

   Query:
   ?page=1
   &limit=9
   &search=budi        (nama / email pendonor, atau lokasi)
   &tanggal=2026-07-31 (tanggal donor)
   &all=true           (untuk Ekspor ke Excel)
========================================================= */

export async function GET(req: NextRequest) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const tanggal = searchParams.get("tanggal")?.trim() ?? "";
    const ambilSemua = searchParams.get("all") === "true";

    const pageRaw = Number(searchParams.get("page") ?? "1");
    const limitRaw = Number(searchParams.get("limit") ?? "9");

    const page =
      Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    const limit =
      Number.isInteger(limitRaw) &&
      limitRaw > 0 &&
      limitRaw <= 50
        ? limitRaw
        : 9;

    /* =====================================================
       FILTER
    ===================================================== */

    const AND: Prisma.RiwayatDonorWhereInput[] = [];

    if (search) {
      AND.push({
        OR: [
          { lokasi_donor: { contains: search } },
          { pendonor: { nama_lengkap: { contains: search } } },
          { pendonor: { email: { contains: search } } },
        ],
      });
    }

    if (tanggal) {
      const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal);

      if (!cocok) {
        return NextResponse.json(
          { message: "Format tanggal tidak valid" },
          { status: 400 }
        );
      }

      const tahun = Number(cocok[1]);
      const bulan = Number(cocok[2]);
      const hari = Number(cocok[3]);

      const awal = new Date(tahun, bulan - 1, hari);
      const akhir = new Date(tahun, bulan - 1, hari + 1);

      AND.push({
        tanggal_donor: { gte: awal, lt: akhir },
      });
    }

    const where: Prisma.RiwayatDonorWhereInput =
      AND.length > 0 ? { AND } : {};

    /* =====================================================
       SELECT
    ===================================================== */

    const select = {
      id_riwayat: true,
      tanggal_donor: true,
      status_donor: true,
      lokasi_donor: true,
      darah_terkumpul: true,
      pendonor: {
        select: {
          id_pendonor: true,
          nama_lengkap: true,
          email: true,
          golongan_darah: true,
          jenis_kelamin: true,
          tanggal_lahir: true,
        },
      },
    } satisfies Prisma.RiwayatDonorSelect;

    /* =====================================================
       MODE EKSPOR
    ===================================================== */

    if (ambilSemua) {
      const semua = await prisma.riwayatDonor.findMany({
        where,
        select,
        orderBy: { tanggal_donor: "desc" },
      });

      return NextResponse.json({
        message: "Semua riwayat donor berhasil diambil",
        data: semua,
      });
    }

    /* =====================================================
       QUERY DATA + COUNT
    ===================================================== */

    const [total, riwayat] = await Promise.all([
      prisma.riwayatDonor.count({ where }),
      prisma.riwayatDonor.findMany({
        where,
        select,
        orderBy: { tanggal_donor: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    /* Opsi dropdown tanggal (distinct tanggal_donor) */
    const tanggalRows = await prisma.riwayatDonor.findMany({
      select: { tanggal_donor: true },
      distinct: ["tanggal_donor"],
      orderBy: { tanggal_donor: "desc" },
    });

    const opsiTanggal = tanggalRows.map((t) =>
      t.tanggal_donor.toISOString().slice(0, 10)
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      message: "Data riwayat donor berhasil diambil",
      data: riwayat,
      pagination: { page, limit, total, totalPages },
      options: { tanggal: opsiTanggal },
    });
  } catch (error) {
    console.error("GET RIWAYAT ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil data riwayat donor",
        error:
          process.env.NODE_ENV === "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
