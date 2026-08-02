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

const BATAS_AMAN = 150;
const BATAS_MENIPIS = 50;

function hitungStatus(jumlah: number): "aman" | "menipis" | "kritis" {
  if (jumlah >= BATAS_AMAN) return "aman";
  if (jumlah >= BATAS_MENIPIS) return "menipis";
  return "kritis";
}

/* =========================================================
   GET DETAIL STOK DARAH
========================================================= */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const idStok = Number(id);

    if (!Number.isInteger(idStok) || idStok <= 0) {
      return NextResponse.json(
        { message: "ID stok tidak valid" },
        { status: 400 }
      );
    }

    const stok = await prisma.stokDarah.findUnique({
      where: { id_stok: idStok },
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
    });

    if (!stok) {
      return NextResponse.json(
        { message: "Stok darah tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Detail stok darah berhasil diambil",
      data: {
        id_stok: stok.id_stok,
        golongan_darah: stok.golongan_darah,
        jumlah_kantong: stok.jumlah_kantong,
        status: hitungStatus(stok.jumlah_kantong),
        tanggal_update: stok.tanggal_update,
        lokasi: stok.lokasi,
      },
    });
  } catch (error) {
    console.error("GET DETAIL STOK DARAH ERROR:", error);

    return NextResponse.json(
      { message: "Gagal mengambil detail stok darah" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT / EDIT STOK DARAH

   Yang bisa diubah admin: jumlah_kantong & alamat lokasi
   (golongan darah dan lokasi bersifat tetap/readonly).
========================================================= */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const idStok = Number(id);

    if (!Number.isInteger(idStok) || idStok <= 0) {
      return NextResponse.json(
        { message: "ID stok tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.stokDarah.findUnique({
      where: { id_stok: idStok },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Stok darah tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await req.json();

    const jumlah_kantong = body.jumlah_kantong;
    const alamat_lokasi = body.alamat_lokasi as string | undefined;

    if (
      jumlah_kantong === undefined ||
      jumlah_kantong === null ||
      jumlah_kantong === ""
    ) {
      return NextResponse.json(
        { message: "Jumlah stok wajib diisi" },
        { status: 400 }
      );
    }

    const jumlahNumber = Number(jumlah_kantong);

    if (!Number.isInteger(jumlahNumber) || jumlahNumber < 0) {
      return NextResponse.json(
        { message: "Jumlah stok harus berupa angka bulat dan tidak boleh negatif" },
        { status: 400 }
      );
    }

    if (!alamat_lokasi || !alamat_lokasi.trim()) {
      return NextResponse.json(
        { message: "Alamat lokasi wajib diisi" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const stokUpdated = await tx.stokDarah.update({
        where: { id_stok: idStok },
        data: {
          jumlah_kantong: jumlahNumber,
          tanggal_update: new Date(),
        },
      });

      if (existing.id_lokasi) {
        await tx.lokasiDonor.update({
          where: { id_lokasi: existing.id_lokasi },
          data: { alamat: alamat_lokasi.trim() },
        });
      }

      return stokUpdated;
    });

    return NextResponse.json({
      message: "Stok darah berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("UPDATE STOK DARAH ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal memperbarui stok darah",
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
