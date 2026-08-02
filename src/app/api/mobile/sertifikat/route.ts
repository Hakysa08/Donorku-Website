import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

const NAMA_BULAN_SINGKAT = [
  "JAN", "FEB", "MAR", "APR", "MEI", "JUN",
  "JUL", "AGU", "SEP", "OKT", "NOV", "DES",
];

function buatNomorSertifikat(idPendonor: number, idRiwayat: number, tanggal: Date): string {
  const bln = NAMA_BULAN_SINGKAT[tanggal.getMonth()];
  const thn = String(tanggal.getFullYear()).slice(-2);
  return `PMI-${idPendonor}-${idRiwayat}/${bln}${thn}`;
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
    const pendonor = await prisma.pendonor.findUnique({
      where: { id_pendonor: payload.id_pendonor },
      select: {
        nama_lengkap: true,
        golongan_darah: true,
        is_deleted: true,
      },
    });

    if (!pendonor || pendonor.is_deleted) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    const riwayat = await prisma.riwayatDonor.findMany({
      where: {
        id_pendonor: payload.id_pendonor,
        status_donor: "berhasil",
      },
      orderBy: { tanggal_donor: "desc" },
      select: {
        id_riwayat: true,
        tanggal_donor: true,
        lokasi_donor: true,
        darah_terkumpul: true,
      },
    });

    const hasil = riwayat.map((r: (typeof riwayat)[number]) => ({
      id_riwayat: r.id_riwayat,
      nomor_sertifikat: buatNomorSertifikat(
        payload.id_pendonor,
        r.id_riwayat,
        r.tanggal_donor
      ),
      nama_pendonor: pendonor.nama_lengkap,
      tanggal_donor: r.tanggal_donor.toISOString().split("T")[0],
      lokasi_donor: r.lokasi_donor,
      darah_terkumpul: r.darah_terkumpul ?? 0,
      golongan_darah: pendonor.golongan_darah,
    }));

    return NextResponse.json(hasil);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengambil data sertifikat" },
      { status: 500 }
    );
  }
}