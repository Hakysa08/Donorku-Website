// src/app/api/mobile/edukasi/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.aturanDanTips.findMany({
      where: { status: "publish" },
      orderBy: { tanggal_dibuat: "asc" },
      select: {
        id_tips: true,
        judul: true,
        isi: true,
        kategori: true,
      },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengambil data edukasi" },
      { status: 500 }
    );
  }
}