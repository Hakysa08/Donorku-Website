import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

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
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const hariIni = new Date(new Date().toDateString());
    const jamSekarang = jamSekarangUntukKolomTime();

    const filterJadwalAktif = {
      status_jadwal: "aktif" as const,
      OR: [
        { tanggal_pelaksanaan: { gt: hariIni } },
        { tanggal_pelaksanaan: hariIni, jam_selesai: { gt: jamSekarang } },
      ],
    };

    const lokasi = await prisma.lokasiDonor.findMany({
      where: {
        jadwal_donor: { some: filterJadwalAktif },
        ...(search
          ? {
              OR: [
                { nama_lokasi: { contains: search } },
                { alamat: { contains: search } },
                { kota: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { nama_lokasi: "asc" },
      select: {
        id_lokasi: true,
        nama_lokasi: true,
        alamat: true,
        kota: true,
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
            // Hitung pendaftar yang diterima/menunggu untuk sisa kuota
            pendaftaran: {
              where: {
                status_pendaftaran: { in: ["menunggu", "diterima"] },
              },
              select: { id_pendaftaran: true },
            },
          },
          take: 1, // jadwal aktif terdekat
        },
      },
    });

    const hasil = lokasi.map((l: (typeof lokasi)[number]) => {
      const jadwal = l.jadwal_donor[0] ?? null;
      const jumlahTerdaftar = jadwal?.pendaftaran.length ?? 0;
      const offlineTerdaftar = jadwal?.total_pendonor_offline ?? 0;
      const sisaKuota = jadwal ? jadwal.kuota - jumlahTerdaftar - offlineTerdaftar : null;

      return {
        id_lokasi: l.id_lokasi,
        nama_lokasi: l.nama_lokasi,
        alamat: l.alamat,
        kota: l.kota,
        latitude: l.latitude,
        longitude: l.longitude,
        foto_lokasi: jadwal?.foto_lokasi ?? l.foto_lokasi ?? null,
        status_donor: "Open Donor Darah",
        // Data jadwal aktif — diambil dari jadwal_donor, bukan lokasi_donor
        jam_mulai: jadwal ? formatJam(jadwal.jam_mulai) : null,
        jam_selesai: jadwal ? formatJam(jadwal.jam_selesai) : null,
        sisa_kuota: sisaKuota,
        tanggal_pelaksanaan: jadwal?.tanggal_pelaksanaan
          ? jadwal.tanggal_pelaksanaan.toISOString().split("T")[0]
          : null,
      };
    });

    return NextResponse.json(hasil);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal mengambil data lokasi" }, { status: 500 });
  }
}