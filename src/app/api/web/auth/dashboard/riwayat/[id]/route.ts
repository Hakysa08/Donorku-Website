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
   CARI ALAMAT LOKASI

   lokasi_donor pada riwayat berupa teks bebas. Fungsi ini
   mencoba mencocokkannya dengan tabel LokasiDonor agar bisa
   menampilkan alamat lengkap.
========================================================= */

async function cariAlamatLokasi(
  namaLokasi?: string | null
): Promise<string | null> {
  const nama = namaLokasi?.trim();
  if (!nama) return null;

  const lokasi = await prisma.lokasiDonor.findFirst({
    where: {
      OR: [
        { nama_lokasi: nama },
        { nama_lokasi: { contains: nama } },
      ],
    },
    select: { alamat: true },
  });

  return lokasi?.alamat ?? null;
}

/* =========================================================
   GET DETAIL RIWAYAT DONOR

   GET /api/web/auth/dashboard/riwayat/[id]
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
    const idRiwayat = Number(id);

    if (!Number.isInteger(idRiwayat) || idRiwayat <= 0) {
      return NextResponse.json(
        { message: "ID riwayat tidak valid" },
        { status: 400 }
      );
    }

    const riwayat = await prisma.riwayatDonor.findUnique({
      where: { id_riwayat: idRiwayat },
      select: {
        id_riwayat: true,
        tanggal_donor: true,
        status_donor: true,
        lokasi_donor: true,
        keterangan: true,
        darah_terkumpul: true,
        hemoglobin: true,
        tekanan_darah_sistole: true,
        tekanan_darah_diastole: true,
        status_skrining: true,
        pendonor: {
          select: {
            id_pendonor: true,
            nama_lengkap: true,
            golongan_darah: true,
            jenis_kelamin: true,
            tanggal_lahir: true,
            alamat: true,
            no_hp: true,
            email: true,
            foto_profil: true,
          },
        },
      },
    });

    if (!riwayat) {
      return NextResponse.json(
        { message: "Riwayat donor tidak ditemukan" },
        { status: 404 }
      );
    }

    const alamat_lokasi = await cariAlamatLokasi(
      riwayat.lokasi_donor
    );

    return NextResponse.json({
      message: "Detail riwayat donor berhasil diambil",
      data: { ...riwayat, alamat_lokasi },
    });
  } catch (error) {
    console.error("GET DETAIL RIWAYAT ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil detail riwayat donor",
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
   PATCH  UBAH STATUS / DARAH TERKUMPUL RIWAYAT DONOR

   PATCH /api/web/auth/dashboard/riwayat/[id]
   Body: { status_donor?: "berhasil"|"gagal"|"ditunda",
           darah_terkumpul?: number }
========================================================= */

const STATUS_DONOR_VALID = ["berhasil", "gagal", "ditunda"] as const;
type StatusDonor = (typeof STATUS_DONOR_VALID)[number];

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
    const idRiwayat = Number(id);

    if (!Number.isInteger(idRiwayat) || idRiwayat <= 0) {
      return NextResponse.json(
        { message: "ID riwayat tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);

    const data: {
      status_donor?: StatusDonor;
      darah_terkumpul?: number;
    } = {};

    if (body?.status_donor !== undefined) {
      if (
        !STATUS_DONOR_VALID.includes(body.status_donor as StatusDonor)
      ) {
        return NextResponse.json(
          { message: "Status tidak valid" },
          { status: 400 }
        );
      }
      data.status_donor = body.status_donor as StatusDonor;
    }

    if (body?.darah_terkumpul !== undefined) {
      const nilai = Number(body.darah_terkumpul);
      if (
        body.darah_terkumpul === null ||
        !Number.isFinite(nilai) ||
        nilai < 0
      ) {
        return NextResponse.json(
          { message: "Darah terkumpul tidak valid" },
          { status: 400 }
        );
      }
      data.darah_terkumpul = nilai;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data yang diubah" },
        { status: 400 }
      );
    }

    const ada = await prisma.riwayatDonor.findUnique({
      where: { id_riwayat: idRiwayat },
      select: { id_riwayat: true },
    });

    if (!ada) {
      return NextResponse.json(
        { message: "Riwayat donor tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.riwayatDonor.update({
      where: { id_riwayat: idRiwayat },
      data,
      select: {
        id_riwayat: true,
        status_donor: true,
        darah_terkumpul: true,
      },
    });

    return NextResponse.json({
      message: "Riwayat donor berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error("PATCH RIWAYAT ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal memperbarui riwayat donor",
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
   DELETE  HAPUS RIWAYAT DONOR

   DELETE /api/web/auth/dashboard/riwayat/[id]
========================================================= */

export async function DELETE(
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
    const idRiwayat = Number(id);

    if (!Number.isInteger(idRiwayat) || idRiwayat <= 0) {
      return NextResponse.json(
        { message: "ID riwayat tidak valid" },
        { status: 400 }
      );
    }

    const ada = await prisma.riwayatDonor.findUnique({
      where: { id_riwayat: idRiwayat },
      select: { id_riwayat: true },
    });

    if (!ada) {
      return NextResponse.json(
        { message: "Riwayat donor tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.riwayatDonor.delete({
      where: { id_riwayat: idRiwayat },
    });

    return NextResponse.json({
      message: "Riwayat donor berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE RIWAYAT ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal menghapus riwayat donor",
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
