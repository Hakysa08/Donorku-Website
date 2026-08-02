import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";
import { cekJarakDonorTerakhir } from "@/lib/donorEligibility";

export async function GET(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  const filter = req.nextUrl.searchParams.get("filter") ?? "semua";

  let tanggalMulai: Date | undefined;
  const sekarang = new Date();
  if (filter === "1_bulan") {
    tanggalMulai = new Date(sekarang);
    tanggalMulai.setMonth(tanggalMulai.getMonth() - 1);
  } else if (filter === "6_bulan") {
    tanggalMulai = new Date(sekarang);
    tanggalMulai.setMonth(tanggalMulai.getMonth() - 6);
  } else if (filter === "1_tahun") {
    tanggalMulai = new Date(sekarang);
    tanggalMulai.setFullYear(tanggalMulai.getFullYear() - 1);
  }

  try {
    const pendonor = await prisma.pendonor.findUnique({
      where: { id_pendonor: payload.id_pendonor },
      select: { id_pendonor: true, jenis_kelamin: true, is_deleted: true },
    });

    if (!pendonor || pendonor.is_deleted) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    const semuaRiwayatSelesai = await prisma.riwayatDonor.findMany({
      where: {
        id_pendonor: pendonor.id_pendonor,
        status_donor: "berhasil",
      },
      select: {
        darah_terkumpul: true,
        hemoglobin: true,
        tekanan_darah_sistole: true,
        tekanan_darah_diastole: true,
        status_skrining: true,
        tanggal_donor: true,
      },
      orderBy: { tanggal_donor: "desc" },
    });

    const totalDonasi = semuaRiwayatSelesai.length;
    const totalMlDarah = semuaRiwayatSelesai.reduce(
      (sum: number, r: (typeof semuaRiwayatSelesai)[number]) => sum + (r.darah_terkumpul ?? 0),
      0
    );

    const riwayatTerakhir = semuaRiwayatSelesai[0] ?? null;
    const statusKesehatan = riwayatTerakhir
      ? {
          hemoglobin: riwayatTerakhir.hemoglobin
            ? riwayatTerakhir.hemoglobin.toString()
            : null,
          tekanan_darah:
            riwayatTerakhir.tekanan_darah_sistole != null &&
            riwayatTerakhir.tekanan_darah_diastole != null
              ? `${riwayatTerakhir.tekanan_darah_sistole}/${riwayatTerakhir.tekanan_darah_diastole}`
              : null,
          status_skrining: riwayatTerakhir.status_skrining ?? null,
        }
      : null;

    const kelayakan = await cekJarakDonorTerakhir(
      pendonor.id_pendonor,
      pendonor.jenis_kelamin
    );

    const daftarRiwayat = await prisma.riwayatDonor.findMany({
      where: {
        id_pendonor: pendonor.id_pendonor,
        ...(tanggalMulai ? { tanggal_donor: { gte: tanggalMulai } } : {}),
      },
      select: {
        id_riwayat: true,
        tanggal_donor: true,
        lokasi_donor: true,
        darah_terkumpul: true,
        status_donor: true,
        pendonor: { select: { golongan_darah: true } },
      },
      orderBy: { tanggal_donor: "desc" },
    });

    return NextResponse.json({
      summary: {
        total_donasi: totalDonasi,
        total_ml_darah: totalMlDarah,
        tanggal_boleh_donor: kelayakan.layak
          ? null
          : kelayakan.tanggal_boleh_donor,
      },
      status_kesehatan: statusKesehatan,
      riwayat: daftarRiwayat.map((r: (typeof daftarRiwayat)[number]) => ({
        id_riwayat: r.id_riwayat,
        tanggal_donor: r.tanggal_donor.toISOString().split("T")[0],
        lokasi_donor: r.lokasi_donor,
        darah_terkumpul: r.darah_terkumpul,
        golongan_darah: r.pendonor.golongan_darah,
        status_donor: r.status_donor,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengambil data riwayat" },
      { status: 500 }
    );
  }
}