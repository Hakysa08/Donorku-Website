import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

function formatJam(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  let body: { id_jadwal?: number; jawaban?: Record<string, boolean> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }

  const { id_jadwal, jawaban } = body;
  if (!id_jadwal || !jawaban) {
    return NextResponse.json(
      { message: "id_jadwal dan jawaban wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const pendonor = await prisma.pendonor.findUnique({
      where: { id_pendonor: payload.id_pendonor },
      select: { id_pendonor: true, id_admin: true, is_deleted: true },
    });

    if (!pendonor || pendonor.is_deleted) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek jadwal masih aktif dan belum lewat
    const jadwal = await prisma.jadwalDonor.findUnique({
      where: { id_jadwal },
      include: { lokasi: { select: { nama_lokasi: true } } },
    });

    if (!jadwal || jadwal.status_jadwal !== "aktif") {
      return NextResponse.json(
        { message: "Jadwal tidak ditemukan atau tidak aktif" },
        { status: 404 }
      );
    }

    // Cek sisa kuota
    const jumlahTerdaftar = await prisma.pendaftaran.count({
      where: {
        id_jadwal,
        status_pendaftaran: { in: ["menunggu", "diterima"] },
      },
    });

    if (jumlahTerdaftar >= jadwal.kuota) {
      return NextResponse.json(
        { message: "Kuota jadwal ini sudah penuh" },
        { status: 409 }
      );
    }

    // Cek pendonor belum daftar di jadwal yang sama
    const sudahDaftar = await prisma.pendaftaran.findFirst({
      where: {
        id_pendonor: pendonor.id_pendonor,
        id_jadwal,
        status_pendaftaran: { in: ["menunggu", "diterima"] },
      },
    });

    if (sudahDaftar) {
      return NextResponse.json(
        { message: "Anda sudah mendaftar di jadwal ini" },
        { status: 409 }
      );
    }

    // Nomor antrian = jumlah yang sudah daftar + 1
    const nomorAntrian = jumlahTerdaftar + 1;

    // Buat pendaftaran + kuesioner dalam 1 transaksi
    const pendaftaran = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const p = await tx.pendaftaran.create({
        data: {
          id_admin: pendonor.id_admin,
          id_pendonor: pendonor.id_pendonor,
          id_jadwal,
          nomor_antrian: nomorAntrian,
          status_pendaftaran: "menunggu",
        },
      });

      await tx.kuesionerKesehatan.create({
        data: {
          id_pendaftaran: p.id_pendaftaran,
          demam_flu_batuk:          jawaban.demam_flu_batuk          ?? false,
          sehat_hari_ini:           jawaban.sehat_hari_ini           ?? true,
          pernah_dirawat:           jawaban.pernah_dirawat           ?? false,
          sudah_makan:              jawaban.sudah_makan              ?? true,
          konsumsi_alkohol:         jawaban.konsumsi_alkohol         ?? false,
          konsumsi_obat:            jawaban.konsumsi_obat            ?? false,
          pernah_pingsan_donor:     jawaban.pernah_pingsan_donor     ?? false,
          riwayat_jantung_diabetes: jawaban.riwayat_jantung_diabetes ?? false,
          riwayat_hepatitis_hiv:    jawaban.riwayat_hepatitis_hiv    ?? false,
          hamil_menyusui:           jawaban.hamil_menyusui           ?? false,
          baru_operasi:             jawaban.baru_operasi             ?? false,
          baru_vaksin:              jawaban.baru_vaksin              ?? false,
          bersedia_sukarela:        jawaban.bersedia_sukarela        ?? true,
        },
      });

      await tx.jadwalDonor.update({
        where: { id_jadwal },
        data: {
            total_pendonor_online: { increment: 1 },
        },
      });

      return p;
    });

    return NextResponse.json(
      {
        message: "Pendaftaran berhasil",
        id_pendaftaran: pendaftaran.id_pendaftaran,
        nomor_antrian: nomorAntrian,
        lokasi: jadwal.lokasi.nama_lokasi,
        tanggal: jadwal.tanggal_pelaksanaan?.toISOString().split("T")[0] ?? null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal melakukan pendaftaran" },
      { status: 500 }
    );
  }
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
    const daftarPendaftaran = await prisma.pendaftaran.findMany({
      where: { id_pendonor: payload.id_pendonor },
      orderBy: { tanggal_daftar: "desc" },
      select: {
        id_pendaftaran: true,
        nomor_antrian: true,
        tanggal_daftar: true,
        status_pendaftaran: true,
        jadwal: {
          select: {
            tanggal_pelaksanaan: true,
            jam_mulai: true,
            jam_selesai: true,
            lokasi: { select: { nama_lokasi: true } },
          },
        },
      },
    });

    const semuaRiwayat = await prisma.riwayatDonor.findMany({
      where: { id_pendonor: payload.id_pendonor },
      select: {
        id_riwayat: true,
        tanggal_donor: true,
        lokasi_donor: true,
        status_donor: true,
        darah_terkumpul: true,
      },
    });

    const hasil = daftarPendaftaran.map((p: (typeof daftarPendaftaran)[number]) => {
      const tglJadwal = p.jadwal.tanggal_pelaksanaan
        ?.toISOString()
        .split("T")[0];
      const namaLokasi = p.jadwal.lokasi.nama_lokasi;

      const riwayat =
        semuaRiwayat.find(
          (r: (typeof semuaRiwayat)[number]) =>
            r.tanggal_donor.toISOString().split("T")[0] === tglJadwal &&
            r.lokasi_donor === namaLokasi
        ) ?? null;

      return {
        id_pendaftaran: p.id_pendaftaran,
        nomor_antrian: p.nomor_antrian,
        tanggal_daftar: p.tanggal_daftar.toISOString().split("T")[0],
        status_pendaftaran: p.status_pendaftaran,
        jadwal: {
          tanggal_pelaksanaan: tglJadwal ?? null,
          jam_mulai: formatJam(p.jadwal.jam_mulai),
          jam_selesai: formatJam(p.jadwal.jam_selesai),
          lokasi: namaLokasi,
        },
        riwayat: riwayat
          ? {
              id_riwayat: riwayat.id_riwayat,
              status_donor: riwayat.status_donor,
              darah_terkumpul: riwayat.darah_terkumpul,
            }
          : null,
      };
    });

    return NextResponse.json(hasil);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengambil data pendaftaran" },
      { status: 500 }
    );
  }
}