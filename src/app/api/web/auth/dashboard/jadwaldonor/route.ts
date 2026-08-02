// LABEL FILE: app/api/web/auth/dashboard/jadwaldonor/route.ts
// GET (list), DELETE, POST (tambah jadwal, multi-foto maks 5)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

type TokenPayload = {
  id_admin: number;
  email: string;
};

const MAX_FOTO = 5;

function verifyToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

function formatTime(date: Date | null) {
  if (!date) return null;
  return date.toISOString().substring(11, 16);
}

/* =========================================================
   FOTO_LOKASI: String -> string[]
   Kolom tetap String di skema; isinya JSON array path.
   Data lama (path polos, bukan JSON) tetap kebaca sebagai
   array 1 elemen (fallback).
========================================================= */

function parseFotoLokasi(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is string => typeof item === "string"
      );
    }
    return [raw];
  } catch {
    return [raw];
  }
}

/* =========================================================
   GET JADWAL (list)
========================================================= */

export async function GET(req: NextRequest) {
  try {
    const admin = verifyToken(req);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const tanggal = searchParams.get("tanggal") ?? "";

    const pageRaw = Number(searchParams.get("page") ?? "1");
    const limitRaw = Number(searchParams.get("limit") ?? "8");

    const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limit =
      Number.isInteger(limitRaw) && limitRaw > 0 && limitRaw <= 50
        ? limitRaw
        : 8;

    const AND: any[] = [];

    if (search) {
      AND.push({
        OR: [
          { nama_penanggung_jawab: { contains: search } },
          { kontak_penanggung_jawab: { contains: search } },
          {
            lokasi: {
              is: {
                OR: [
                  { nama_lokasi: { contains: search } },
                  { alamat: { contains: search } },
                  { kota: { contains: search } },
                ],
              },
            },
          },
        ],
      });
    }

    if (tanggal) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal);

      if (!match) {
        return NextResponse.json(
          { message: "Format tanggal tidak valid" },
          { status: 400 }
        );
      }

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      const startDate = new Date(year, month - 1, day);
      const endDate = new Date(year, month - 1, day + 1);

      AND.push({
        tanggal_pelaksanaan: { gte: startDate, lt: endDate },
      });
    }

    const where = AND.length > 0 ? { AND } : {};

    const [total, jadwal] = await Promise.all([
      prisma.jadwalDonor.count({ where }),
      prisma.jadwalDonor.findMany({
        where,
        select: {
          id_jadwal: true,
          tanggal_pelaksanaan: true,
          jam_mulai: true,
          jam_selesai: true,
          kuota: true,
          status_jadwal: true,
          nama_penanggung_jawab: true,
          kontak_penanggung_jawab: true,
          total_pendonor_offline: true,
          pendonor_hadir: true,
          darah_terkumpul: true,
          foto_lokasi: true,
          lokasi: {
            select: {
              id_lokasi: true,
              nama_lokasi: true,
              alamat: true,
              kota: true,
            },
          },
          admin: { select: { nama_admin: true } },
          _count: { select: { pendaftaran: true } },
        },
        orderBy: [{ id_jadwal: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = jadwal.map((item) => ({
      id_jadwal: item.id_jadwal,
      tanggal_pelaksanaan: item.tanggal_pelaksanaan,
      jam_mulai: formatTime(item.jam_mulai),
      jam_selesai: formatTime(item.jam_selesai),
      kuota: item.kuota,
      status_jadwal: item.status_jadwal,
      total_pendaftar_online: item._count.pendaftaran,
      total_pendonor_offline: item.total_pendonor_offline ?? 0,
      pendonor_hadir: item.pendonor_hadir ?? 0,
      darah_terkumpul: item.darah_terkumpul ?? 0,
      nama_penanggung_jawab: item.nama_penanggung_jawab,
      kontak_penanggung_jawab: item.kontak_penanggung_jawab,
      foto_lokasi: parseFotoLokasi(item.foto_lokasi),
      lokasi: item.lokasi,
      penyelenggara: item.admin.nama_admin,
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      message: "Data jadwal berhasil diambil",
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("GET JADWAL ERROR:", error);
    return NextResponse.json(
      {
        message: "Gagal mengambil data jadwal",
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE JADWAL
========================================================= */

export async function DELETE(req: NextRequest) {
  try {
    const admin = verifyToken(req);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const idRaw = searchParams.get("id");

    if (!idRaw) {
      return NextResponse.json(
        { message: "ID jadwal wajib diisi" },
        { status: 400 }
      );
    }

    const id = Number(idRaw);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { message: "ID jadwal tidak valid" },
        { status: 400 }
      );
    }

    const jadwal = await prisma.jadwalDonor.findUnique({
      where: { id_jadwal: id },
    });

    if (!jadwal) {
      return NextResponse.json(
        { message: "Jadwal tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.jadwalDonor.delete({ where: { id_jadwal: id } });

    return NextResponse.json({ message: "Jadwal berhasil dihapus" });
  } catch (error) {
    console.error("DELETE JADWAL ERROR:", error);
    return NextResponse.json(
      {
        message: "Gagal menghapus jadwal",
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST / TAMBAH JADWAL (multi-foto, maks 5)
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const admin = verifyToken(req);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const id_lokasi = formData.get("id_lokasi") as string | null;
    const tanggal_pelaksanaan = formData.get(
      "tanggal_pelaksanaan"
    ) as string | null;
    const jam_mulai = formData.get("jam_mulai") as string | null;
    const jam_selesai = formData.get("jam_selesai") as string | null;
    const nama_penanggung_jawab = formData.get(
      "nama_penanggung_jawab"
    ) as string | null;
    const kontak_penanggung_jawab = formData.get(
      "kontak_penanggung_jawab"
    ) as string | null;
    const kuota = formData.get("kuota") as string | null;
    const total_pendonor_offline = formData.get(
      "total_pendonor_offline"
    ) as string | null;
    const pendonor_hadir = formData.get("pendonor_hadir") as string | null;
    const darah_terkumpul = formData.get("darah_terkumpul") as string | null;

    const fotoFiles = formData
      .getAll("foto")
      .filter(
        (item): item is File => item instanceof File && item.size > 0
      );

    if (!id_lokasi) {
      return NextResponse.json(
        { message: "Lokasi donor wajib dipilih" },
        { status: 400 }
      );
    }
    if (!tanggal_pelaksanaan) {
      return NextResponse.json(
        { message: "Tanggal pelaksanaan wajib diisi" },
        { status: 400 }
      );
    }
    if (!jam_mulai || !jam_selesai) {
      return NextResponse.json(
        { message: "Waktu mulai dan waktu selesai wajib diisi" },
        { status: 400 }
      );
    }
    if (!nama_penanggung_jawab?.trim()) {
      return NextResponse.json(
        { message: "Nama penanggung jawab wajib diisi" },
        { status: 400 }
      );
    }
    if (!kontak_penanggung_jawab?.trim()) {
      return NextResponse.json(
        { message: "Kontak penanggung jawab wajib diisi" },
        { status: 400 }
      );
    }
    if (fotoFiles.length === 0) {
      return NextResponse.json(
        { message: "Foto lokasi wajib diunggah" },
        { status: 400 }
      );
    }
    if (fotoFiles.length > MAX_FOTO) {
      return NextResponse.json(
        { message: `Foto lokasi maksimal ${MAX_FOTO} gambar` },
        { status: 400 }
      );
    }

    for (const file of fotoFiles) {
      if (file.type !== "image/jpeg") {
        return NextResponse.json(
          { message: "Foto harus berformat JPG/JPEG" },
          { status: 400 }
        );
      }
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { message: "Ukuran tiap foto maksimal 5 MB" },
          { status: 400 }
        );
      }
    }

    const idLokasi = Number(id_lokasi);

    if (!Number.isInteger(idLokasi)) {
      return NextResponse.json(
        { message: "Lokasi tidak valid" },
        { status: 400 }
      );
    }

    const lokasi = await prisma.lokasiDonor.findUnique({
      where: { id_lokasi: idLokasi },
    });

    if (!lokasi) {
      return NextResponse.json(
        { message: "Lokasi donor tidak ditemukan" },
        { status: 404 }
      );
    }

    /* Anchor sebagai UTC midnight (bukan local midnight) supaya
       tanggal yang tersimpan di kolom @db.Date TIDAK bergeser
       mundur satu hari akibat konversi timezone server. */
    const tanggal = new Date(`${tanggal_pelaksanaan}T00:00:00Z`);

    if (Number.isNaN(tanggal.getTime())) {
      return NextResponse.json(
        { message: "Tanggal tidak valid" },
        { status: 400 }
      );
    }

    const mulai = new Date(`1970-01-01T${jam_mulai}:00`);
    const selesai = new Date(`1970-01-01T${jam_selesai}:00`);

    if (Number.isNaN(mulai.getTime()) || Number.isNaN(selesai.getTime())) {
      return NextResponse.json(
        { message: "Format waktu tidak valid" },
        { status: 400 }
      );
    }

    if (selesai <= mulai) {
      return NextResponse.json(
        { message: "Waktu selesai harus setelah waktu mulai" },
        { status: 400 }
      );
    }

    const kuotaNumber = Number(kuota ?? 0);
    const offlineNumber = Number(total_pendonor_offline ?? 0);
    const hadirNumber = Number(pendonor_hadir ?? 0);
    const darahNumber = Number(darah_terkumpul ?? 0);

    if (
      kuotaNumber < 0 ||
      offlineNumber < 0 ||
      hadirNumber < 0 ||
      darahNumber < 0
    ) {
      return NextResponse.json(
        { message: "Jumlah donor tidak boleh bernilai negatif" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "jadwal-donor"
    );

    await mkdir(uploadDir, { recursive: true });

    const fotoPaths: string[] = [];

    for (const file of fotoFiles) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `jadwal-${Date.now()}-${Math.round(
        Math.random() * 1e6
      )}.jpg`;

      await writeFile(path.join(uploadDir, filename), buffer);
      fotoPaths.push(`/uploads/jadwal-donor/${filename}`);
    }

    const jadwal = await prisma.jadwalDonor.create({
      data: {
        id_admin: admin.id_admin,
        id_lokasi: idLokasi,
        tanggal_pelaksanaan: tanggal,
        jam_mulai: mulai,
        jam_selesai: selesai,
        nama_penanggung_jawab: nama_penanggung_jawab.trim(),
        kontak_penanggung_jawab: kontak_penanggung_jawab.trim(),
        kuota: kuotaNumber,
        total_pendonor_offline: offlineNumber,
        pendonor_hadir: hadirNumber,
        darah_terkumpul: darahNumber,
        foto_lokasi: JSON.stringify(fotoPaths),
        status_jadwal: "aktif",
      },
      select: {
        id_jadwal: true,
        tanggal_pelaksanaan: true,
        foto_lokasi: true,
        lokasi: { select: { nama_lokasi: true, alamat: true } },
      },
    });

    return NextResponse.json(
      {
        message: "Jadwal donor berhasil ditambahkan",
        data: {
          ...jadwal,
          foto_lokasi: parseFotoLokasi(jadwal.foto_lokasi),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE JADWAL ERROR:", error);
    return NextResponse.json(
      {
        message: "Gagal menambahkan jadwal donor",
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
