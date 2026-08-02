import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

function formatWaktu(tanggal: Date): string {
  const selisihMs = Date.now() - tanggal.getTime();
  const selisihMenit = Math.floor(selisihMs / 60000);
  const selisihJam = Math.floor(selisihMenit / 60);
  const selisihHari = Math.floor(selisihJam / 24);

  if (selisihMenit < 1) return "Baru saja";
  if (selisihMenit < 60) return `${selisihMenit} Menit yang lalu`;
  if (selisihJam < 24) return `${selisihJam} Jam yang lalu`;
  return `${selisihHari} Hari yang lalu`;
}

export async function GET(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  try {
    const notifikasi = await prisma.notifikasi.findMany({
      where: { id_pendonor: payload.id_pendonor },
      orderBy: { created_at: "desc" },
      select: {
        id_notifikasi: true,
        tipe: true,
        judul: true,
        pesan: true,
        is_read: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      notifikasi.map((n: (typeof notifikasi)[number]) => ({
        id_notifikasi: n.id_notifikasi,
        tipe: n.tipe,       // "info" | "success" | "warning"
        judul: n.judul,
        pesan: n.pesan,
        is_read: n.is_read,
        waktu: formatWaktu(n.created_at),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengambil notifikasi" },
      { status: 500 }
    );
  }
}