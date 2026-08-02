// LABEL FILE: app/api/web/auth/dashboard/jadwaldonor/[id]/route.ts
// GET (detail), PUT (edit jadwal, multi-foto maks 5)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

type TokenPayload = {
  id_admin: number;
  email: string;
};

const MAX_FOTO = 5;
const STATUS_VALID = ["aktif", "nonaktif", "selesai"] as const;
type StatusJadwal = (typeof STATUS_VALID)[number];

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
   (sama seperti di route.ts utama)
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
   GET DETAIL JADWAL
========================================================= */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = verifyToken(req);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const idJadwal = Number(id);

    if (!Number.isInteger(idJadwal) || idJadwal <= 0) {
      return NextResponse.json(
        { message: "ID jadwal tidak valid" },
        { status: 400 }
      );
    }

    const jadwal = await prisma.jadwalDonor.findUnique({
      where: { id_jadwal: idJadwal },
      select: {
        id_jadwal: true,
        id_lokasi: true,
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
    });

    if (!jadwal) {
      return NextResponse.json(
        { message: "Jadwal tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Detail jadwal berhasil diambil",
      data: {
        id_jadwal: jadwal.id_jadwal,
        id_lokasi: jadwal.id_lokasi,
        tanggal_pelaksanaan: jadwal.tanggal_pelaksanaan,
        jam_mulai: formatTime(jadwal.jam_mulai),
        jam_selesai: formatTime(jadwal.jam_selesai),
        kuota: jadwal.kuota,
        status_jadwal: jadwal.status_jadwal,
        total_pendaftar_online: jadwal._count.pendaftaran,
        total_pendonor_offline: jadwal.total_pendonor_offline ?? 0,
        pendonor_hadir: jadwal.pendonor_hadir ?? 0,
        darah_terkumpul: jadwal.darah_terkumpul ?? 0,
        nama_penanggung_jawab: jadwal.nama_penanggung_jawab,
        kontak_penanggung_jawab: jadwal.kontak_penanggung_jawab,
        foto_lokasi: parseFotoLokasi(jadwal.foto_lokasi),
        lokasi: jadwal.lokasi,
        penyelenggara: jadwal.admin.nama_admin,
      },
    });
  } catch (error) {
    console.error("GET DETAIL JADWAL ERROR:", error);
    return NextResponse.json(
      { message: "Gagal mengambil detail jadwal" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT / EDIT JADWAL (multi-foto)

   Kontrak dengan frontend:
   - "foto"      : boleh diulang (formData.getAll) -> foto BARU
   - "foto_lama" : JSON array path foto lama yang MASIH mau
                   dipertahankan (yang di-uncheck user di UI
                   Edit tidak dimasukkan ke sini)

   Kalau frontend nggak kirim "foto_lama" sama sekali, semua
   foto lama otomatis dipertahankan (aman dari kehapus nggak
   sengaja).
========================================================= */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = verifyToken(req);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const idJadwal = Number(id);

    if (!Number.isInteger(idJadwal) || idJadwal <= 0) {
      return NextResponse.json(
        { message: "ID jadwal tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.jadwalDonor.findUnique({
      where: { id_jadwal: idJadwal },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Jadwal tidak ditemukan" },
        { status: 404 }
      );
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
    const status_jadwal = formData.get("status_jadwal") as string | null;

    const fotoBaruFiles = formData
      .getAll("foto")
      .filter(
        (item): item is File => item instanceof File && item.size > 0
      );

    const fotoLamaRaw = formData.get("foto_lama") as string | null;
    const fotoLamaSemua = parseFotoLokasi(existing.foto_lokasi);

    let fotoLamaDipertahankan: string[];

    if (fotoLamaRaw === null) {
      fotoLamaDipertahankan = fotoLamaSemua;
    } else {
      try {
        const parsed = JSON.parse(fotoLamaRaw);
        fotoLamaDipertahankan = Array.isArray(parsed)
          ? parsed.filter(
              (item): item is string => typeof item === "string"
            )
          : [];
      } catch {
        fotoLamaDipertahankan = [];
      }
    }

    if (
      !id_lokasi ||
      !tanggal_pelaksanaan ||
      !jam_mulai ||
      !jam_selesai ||
      !nama_penanggung_jawab?.trim() ||
      !kontak_penanggung_jawab?.trim()
    ) {
      return NextResponse.json(
        { message: "Lengkapi semua field wajib" },
        { status: 400 }
      );
    }

    const totalFotoAkhir =
      fotoLamaDipertahankan.length + fotoBaruFiles.length;

    if (totalFotoAkhir === 0) {
      return NextResponse.json(
        { message: "Foto lokasi wajib ada minimal 1" },
        { status: 400 }
      );
    }

    if (totalFotoAkhir > MAX_FOTO) {
      return NextResponse.json(
        { message: `Foto lokasi maksimal ${MAX_FOTO} gambar` },
        { status: 400 }
      );
    }

    for (const file of fotoBaruFiles) {
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

    const statusFinal: StatusJadwal =
      status_jadwal &&
      (STATUS_VALID as readonly string[]).includes(status_jadwal)
        ? (status_jadwal as StatusJadwal)
        : (existing.status_jadwal as StatusJadwal);

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "jadwal-donor"
    );

    await mkdir(uploadDir, { recursive: true });

    const fotoBaruPaths: string[] = [];

    for (const file of fotoBaruFiles) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `jadwal-${Date.now()}-${Math.round(
        Math.random() * 1e6
      )}.jpg`;

      await writeFile(path.join(uploadDir, filename), buffer);
      fotoBaruPaths.push(`/uploads/jadwal-donor/${filename}`);
    }

    const fotoPathsFinal = [...fotoLamaDipertahankan, ...fotoBaruPaths];

    // Hapus file foto lama yang dibuang (best-effort)
    const fotoDibuang = fotoLamaSemua.filter(
      (p) => !fotoLamaDipertahankan.includes(p)
    );

    for (const relPath of fotoDibuang) {
      try {
        await unlink(path.join(process.cwd(), "public", relPath));
      } catch (err) {
        console.warn("GAGAL HAPUS FILE FOTO LAMA:", relPath, err);
      }
    }

    const updated = await prisma.jadwalDonor.update({
      where: { id_jadwal: idJadwal },
      data: {
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
        foto_lokasi: JSON.stringify(fotoPathsFinal),
        status_jadwal: statusFinal,
      },
    });

    return NextResponse.json({
      message: "Jadwal donor berhasil diperbarui",
      data: {
        ...updated,
        foto_lokasi: parseFotoLokasi(updated.foto_lokasi),
      },
    });
  } catch (error) {
    console.error("UPDATE JADWAL ERROR:", error);
    return NextResponse.json(
      {
        message: "Gagal memperbarui jadwal donor",
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
