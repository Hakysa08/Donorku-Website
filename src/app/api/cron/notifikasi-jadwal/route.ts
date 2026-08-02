import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buatNotifikasi, sudahAdaNotifikasiHariIni } from "@/lib/notifikasi";

// Endpoint ini TIDAK dipanggil user - dipanggil scheduler (Vercel Cron / cron server
// terpisah) sekali sehari. Diproteksi pakai secret header, bukan token pendonor biasa.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);
    besok.setHours(0, 0, 0, 0);
    const setelahBesok = new Date(besok);
    setelahBesok.setDate(setelahBesok.getDate() + 1);

    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);
    const setelahHariIni = new Date(hariIni);
    setelahHariIni.setDate(setelahHariIni.getDate() + 1);

    let jumlahDibuat = 0;

    // 1. Reminder H-1: jadwal besok
    const jadwalBesok = await prisma.jadwalDonor.findMany({
      where: {
        status_jadwal: "aktif",
        tanggal_pelaksanaan: { gte: besok, lt: setelahBesok },
      },
      include: {
        lokasi: true,
        pendaftaran: {
          where: { status_pendaftaran: { in: ["diterima", "menunggu"] } },
        },
      },
    });

    for (const jadwal of jadwalBesok) {
      for (const p of jadwal.pendaftaran) {
        const judul = `Reminder jadwal donor besok - jadwal #${jadwal.id_jadwal}`;
        const sudahAda = await sudahAdaNotifikasiHariIni(p.id_pendonor, judul);
        if (sudahAda) continue;

        await buatNotifikasi(
          p.id_pendonor,
          "info",
          judul,
          `Jadwal donor Anda akan dimulai besok di ${jadwal.lokasi.nama_lokasi}`
        );
        jumlahDibuat++;
      }
    }

    // 2. Reminder hari-H: jadwal hari ini
    const jadwalHariIni = await prisma.jadwalDonor.findMany({
      where: {
        status_jadwal: "aktif",
        tanggal_pelaksanaan: { gte: hariIni, lt: setelahHariIni },
      },
      include: {
        lokasi: true,
        pendaftaran: {
          where: { status_pendaftaran: { in: ["diterima", "menunggu"] } },
        },
      },
    });

    for (const jadwal of jadwalHariIni) {
      for (const p of jadwal.pendaftaran) {
        const judul = `Reminder jadwal donor hari ini - jadwal #${jadwal.id_jadwal}`;
        const sudahAda = await sudahAdaNotifikasiHariIni(p.id_pendonor, judul);
        if (sudahAda) continue;

        await buatNotifikasi(
          p.id_pendonor,
          "info",
          judul,
          `Hari ini Anda bisa mendonorkan darah Anda di ${jadwal.lokasi.nama_lokasi}`
        );
        jumlahDibuat++;
      }
    }

    return NextResponse.json({ message: "Cron selesai", notifikasi_dibuat: jumlahDibuat });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menjalankan cron notifikasi" }, { status: 500 });
  }
}