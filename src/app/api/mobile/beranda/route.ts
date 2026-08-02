import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";
import { cekJarakDonorTerakhir } from "@/lib/donorEligibility";

function jamSekarangUntukKolomTime(): Date {
  const now = new Date();
  return new Date(Date.UTC(1970, 0, 1, now.getHours(), now.getMinutes(), now.getSeconds()));
}

function formatJam(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  try {
    const pendonor = await prisma.pendonor.findUnique({ where: { id_pendonor: payload.id_pendonor } });
    if (!pendonor || pendonor.is_deleted) {
      return NextResponse.json({ message: "Akun tidak ditemukan" }, { status: 404 });
    }

    const riwayatBerhasil = await prisma.riwayatDonor.findMany({
      where: { id_pendonor: pendonor.id_pendonor, status_donor: "berhasil" },
    });

    const totalDonasi = riwayatBerhasil.length;
    const totalMlDarah = riwayatBerhasil.reduce(
      (sum: number, r: (typeof riwayatBerhasil)[number]) => sum + (r.darah_terkumpul ?? 0),
      0,
    );

    const kelayakan = await cekJarakDonorTerakhir(pendonor.id_pendonor, pendonor.jenis_kelamin);

    const hariIni = new Date(new Date().toDateString());
    const jamSekarang = jamSekarangUntukKolomTime();

    const filterJadwalAktif = {
      status_jadwal: "aktif" as const,
      OR: [
        { tanggal_pelaksanaan: { gt: hariIni } },
        { tanggal_pelaksanaan: hariIni, jam_selesai: { gt: jamSekarang } },
      ],
    };

    const kandidatLokasi = await prisma.lokasiDonor.findMany({
      where: { jadwal_donor: { some: filterJadwalAktif } },
      take: 5,
      select: {
        id_lokasi: true,
        nama_lokasi: true,
        alamat: true,
        latitude: true,
        longitude: true,
        foto_lokasi: true,
        jadwal_donor: {
          where: filterJadwalAktif,
          select: {
            foto_lokasi: true,
            jam_mulai: true,
            jam_selesai: true,
            kuota: true,
            tanggal_pelaksanaan: true,
            total_pendonor_offline: true,
            pendaftaran: {
              where: {
                status_pendaftaran: { in: ["menunggu", "diterima"] },
              },
              select: { id_pendaftaran: true },
            },
          },
          take: 1,
        },
      },
    });

    const lokasi = kandidatLokasi.map((l: (typeof kandidatLokasi)[number]) => {
      const jadwal = l.jadwal_donor[0] ?? null;
      const jumlahTerdaftar = jadwal?.pendaftaran.length ?? 0;
      const offlineTerdaftar = jadwal?.total_pendonor_offline ?? 0;
      const sisaKuota = jadwal ? Math.max(0, jadwal.kuota - jumlahTerdaftar - offlineTerdaftar) : null;

      return {
        id_lokasi: l.id_lokasi,
        nama_lokasi: l.nama_lokasi,
        alamat: l.alamat,
        latitude: l.latitude,
        longitude: l.longitude,
        foto_lokasi: jadwal?.foto_lokasi ?? l.foto_lokasi ?? null,
        jam_mulai: jadwal ? formatJam(jadwal.jam_mulai) : null,
        jam_selesai: jadwal ? formatJam(jadwal.jam_selesai) : null,
        sisa_kuota: sisaKuota,
        tanggal_pelaksanaan: jadwal?.tanggal_pelaksanaan
          ? jadwal.tanggal_pelaksanaan.toISOString().split("T")[0]
          : null,
      };
    });

    return NextResponse.json({
      nama_lengkap: pendonor.nama_lengkap,
      total_donasi: totalDonasi,
      total_ml_darah: totalMlDarah,
      boleh_donor_sekarang: kelayakan.layak,
      tanggal_boleh_donor: kelayakan.layak ? null : kelayakan.tanggal_boleh_donor,
      lokasi_tersedia: lokasi,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal mengambil data beranda" }, { status: 500 });
  }
}