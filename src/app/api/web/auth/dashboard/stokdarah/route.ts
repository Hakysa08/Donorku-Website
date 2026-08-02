import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id_admin: number;
  email: string;
};

function verifyToken(req: NextRequest) {
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
   AMBANG BATAS STATUS STOK
   (tidak ada kolom status di DB, jadi dihitung dari jumlah)
========================================================= */

const BATAS_AMAN = 150;
const BATAS_MENIPIS = 50;

function hitungStatus(jumlah: number): "aman" | "menipis" | "kritis" {
  if (jumlah >= BATAS_AMAN) return "aman";
  if (jumlah >= BATAS_MENIPIS) return "menipis";
  return "kritis";
}

/* =========================================================
   GET LIST STOK DARAH
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

    const golongan = searchParams.get("golongan_darah")?.trim() ?? "";
    const status = searchParams.get("status")?.trim().toLowerCase() ?? "";

    const pageRaw = Number(searchParams.get("page") ?? "1");
    const limitRaw = Number(searchParams.get("limit") ?? "8");

    const page =
      Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    const limit =
      Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 50
        ? limitRaw
        : 8;

    const where: any = {};

    if (golongan) {
      where.golongan_darah = golongan;
    }

    // ambil semua dulu (tanpa skip/take) karena status dihitung di
    // aplikasi, bukan kolom asli di DB — lalu difilter & dipaginasi manual
    const semuaStok = await prisma.stokDarah.findMany({
      where,
      select: {
        id_stok: true,
        golongan_darah: true,
        jumlah_kantong: true,
        tanggal_update: true,
        lokasi: {
          select: {
            id_lokasi: true,
            nama_lokasi: true,
            alamat: true,
          },
        },
      },
      orderBy: [{ tanggal_update: "desc" }, { id_stok: "desc" }],
    });

    type ItemStok = (typeof semuaStok)[number];

    let data = semuaStok.map((item: ItemStok) => ({
      id_stok: item.id_stok,
      golongan_darah: item.golongan_darah,
      jumlah_kantong: item.jumlah_kantong,
      status: hitungStatus(item.jumlah_kantong),
      tanggal_update: item.tanggal_update,
      lokasi: item.lokasi,
    }));

    type ItemData = (typeof data)[number];

    if (status) {
      data = data.filter((item: ItemData) => item.status === status);
    }

    const total = data.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const dataHalaman = data.slice(
      (page - 1) * limit,
      (page - 1) * limit + limit
    );

    return NextResponse.json({
      message: "Data stok darah berhasil diambil",
      data: dataHalaman,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("GET STOK DARAH ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil data stok darah",
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