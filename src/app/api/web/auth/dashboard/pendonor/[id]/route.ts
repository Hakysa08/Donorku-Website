import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id_admin: number;
  email: string;
};

function verifyToken(req: NextRequest): TokenPayload | null {
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
   GET DETAIL PENDAFTARAN PENDONOR

   GET /api/web/auth/dashboard/pendonor/[id]
   (id = id_pendaftaran)

   Mengembalikan data pendonor + jadwal (lokasi & tanggal
   pelaksanaan) + status + nomor antrian + hasil kuesioner
   kesehatan, sesuai halaman detail Figma (DP-002).
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
    const idPendaftaran = Number(id);

    if (!Number.isInteger(idPendaftaran) || idPendaftaran <= 0) {
      return NextResponse.json(
        { message: "ID pendaftaran tidak valid" },
        { status: 400 }
      );
    }

    const pendaftaran = await prisma.pendaftaran.findFirst({
      where: {
        id_pendaftaran: idPendaftaran,
        pendonor: { is_deleted: false },
      },
      select: {
        id_pendaftaran: true,
        nomor_antrian: true,
        tanggal_daftar: true,
        status_pendaftaran: true,
        pendonor: {
          select: {
            id_pendonor: true,
            nik: true,
            nama_lengkap: true,
            jenis_kelamin: true,
            tanggal_lahir: true,
            alamat: true,
            kota: true,
            profesi: true,
            no_hp: true,
            email: true,
            golongan_darah: true,
            foto_profil: true,
          },
        },
        jadwal: {
          select: {
            tanggal_pelaksanaan: true,
            jam_mulai: true,
            jam_selesai: true,
            lokasi: {
              select: {
                nama_lokasi: true,
                alamat: true,
                kota: true,
              },
            },
          },
        },
        kuesioner: {
          select: {
            demam_flu_batuk: true,
            sehat_hari_ini: true,
            pernah_dirawat: true,
            sudah_makan: true,
            konsumsi_alkohol: true,
            konsumsi_obat: true,
            pernah_pingsan_donor: true,
            riwayat_jantung_diabetes: true,
            riwayat_hepatitis_hiv: true,
            hamil_menyusui: true,
            baru_operasi: true,
            baru_vaksin: true,
            bersedia_sukarela: true,
          },
        },
      },
    });

    if (!pendaftaran) {
      return NextResponse.json(
        { message: "Pendaftaran tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Detail pendaftaran berhasil diambil",
      data: {
        id_pendaftaran: pendaftaran.id_pendaftaran,
        nomor_antrian: pendaftaran.nomor_antrian,
        tanggal_daftar: pendaftaran.tanggal_daftar,
        status: pendaftaran.status_pendaftaran,
        pendonor: pendaftaran.pendonor,
        tanggal_pendonoran:
          pendaftaran.jadwal.tanggal_pelaksanaan ??
          pendaftaran.tanggal_daftar,
        lokasi: pendaftaran.jadwal.lokasi.nama_lokasi,
        alamat_lokasi: pendaftaran.jadwal.lokasi.alamat,
        kota_lokasi: pendaftaran.jadwal.lokasi.kota,
        kuesioner: pendaftaran.kuesioner,
      },
    });
  } catch (error) {
    console.error("GET DETAIL PENDAFTARAN ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil detail pendaftaran",
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

/* =========================================================
   PATCH  UBAH STATUS PENDAFTARAN

   PATCH /api/web/auth/dashboard/pendonor/[id]
   Body: { status: "diterima" | "ditolak" | "dibatalkan" | "selesai" | "batal_hadir" | "menunggu" }
========================================================= */

const STATUS_VALID = [
  "menunggu",
  "diterima",
  "ditolak",
  "dibatalkan",
  "selesai",
  "batal_hadir",
] as const;

type StatusPendaftaran = (typeof STATUS_VALID)[number];

export async function PATCH(
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
    const idPendaftaran = Number(id);

    if (!Number.isInteger(idPendaftaran) || idPendaftaran <= 0) {
      return NextResponse.json(
        { message: "ID pendaftaran tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const status = body?.status as string | undefined;

    if (
      !status ||
      !STATUS_VALID.includes(status as StatusPendaftaran)
    ) {
      return NextResponse.json(
        { message: "Status tidak valid" },
        { status: 400 }
      );
    }

    const ada = await prisma.pendaftaran.findUnique({
      where: { id_pendaftaran: idPendaftaran },
      select: {
        id_pendaftaran: true,
        id_admin: true,
        id_pendonor: true,
        jadwal: {
          select: {
            tanggal_pelaksanaan: true,
            lokasi: { select: { nama_lokasi: true } },
          },
        },
      },
    });

    if (!ada) {
      return NextResponse.json(
        { message: "Pendaftaran tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.pendaftaran.update({
      where: { id_pendaftaran: idPendaftaran },
      data: {
        status_pendaftaran: status as StatusPendaftaran,
      },
      select: {
        id_pendaftaran: true,
        status_pendaftaran: true,
      },
    });

    /* Kalau pendaftaran diterima, otomatis buat entri riwayat_donor
       (default status: ditunda). Dicegah duplikat jika sudah ada
       riwayat untuk pendonor + tanggal + lokasi yang sama. */
    if (status === "diterima") {
      const tanggalDonor =
        ada.jadwal?.tanggal_pelaksanaan ?? new Date();
      const lokasiNama =
        ada.jadwal?.lokasi?.nama_lokasi ?? "-";

      const sudahAda = await prisma.riwayatDonor.findFirst({
        where: {
          id_pendonor: ada.id_pendonor,
          tanggal_donor: tanggalDonor,
          lokasi_donor: lokasiNama,
        },
        select: { id_riwayat: true },
      });

      if (!sudahAda) {
        await prisma.riwayatDonor.create({
          data: {
            id_admin: ada.id_admin,
            id_pendonor: ada.id_pendonor,
            tanggal_donor: tanggalDonor,
            status_donor: "ditunda",
            lokasi_donor: lokasiNama,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Status pendaftaran berhasil diperbarui",
      data: {
        id_pendaftaran: updated.id_pendaftaran,
        status: updated.status_pendaftaran,
      },
    });
  } catch (error) {
    console.error("PATCH STATUS PENDAFTARAN ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal memperbarui status pendaftaran",
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
