import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

export async function POST(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const foto = formData.get("foto") as File | null;

    if (!foto) {
      return NextResponse.json(
        { message: "File foto wajib disertakan" },
        { status: 400 }
      );
    }

    // Validasi tipe file — cek MIME type atau ekstensi
    const tipeValid = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const ekstensionValid = ["jpg", "jpeg", "png", "webp"];
    const ext = foto.name.split(".").pop()?.toLowerCase() ?? "";
    if (!tipeValid.includes(foto.type) && !ekstensionValid.includes(ext)) {
      return NextResponse.json(
        { message: "Format foto tidak valid. Gunakan JPG, PNG, atau WebP" },
        { status: 400 }
      );
    }

    // Validasi ukuran maksimal 5MB
    if (foto.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { message: "Ukuran foto maksimal 5MB" },
        { status: 400 }
      );
    }

    // Buat nama file unik: timestamp-id_pendonor.ext
    const namaFile = `${Date.now()}-${payload.id_pendonor}.${ext || "jpg"}`;

    // Pastikan folder tujuan ada
    const folderTujuan = path.join(process.cwd(), "public", "uploads", "profil_pendonor");
    await mkdir(folderTujuan, { recursive: true });

    // Hapus foto lama kalau ada
    const pendonorLama = await prisma.pendonor.findUnique({
      where: { id_pendonor: payload.id_pendonor },
      select: { foto_profil: true },
    });
    if (pendonorLama?.foto_profil) {
      const pathLama = path.join(process.cwd(), "public", pendonorLama.foto_profil);
      try {
        const { unlink } = await import("fs/promises");
        await unlink(pathLama);
      } catch {
        // File tidak ada / sudah terhapus — tidak masalah, lanjut saja
      }
    }

    // Tulis file baru ke disk
    const buffer = Buffer.from(await foto.arrayBuffer());
    await writeFile(path.join(folderTujuan, namaFile), buffer);

    // Path yang disimpan di database (relatif dari public/)
    const pathDb = `/uploads/profil_pendonor/${namaFile}`;

    // Update kolom foto_profil di pendonor
    await prisma.pendonor.update({
      where: { id_pendonor: payload.id_pendonor },
      data: { foto_profil: pathDb },
    });

    return NextResponse.json({
      message: "Foto profil berhasil diperbarui",
      foto_profil: pathDb,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengupload foto profil" },
      { status: 500 }
    );
  }
}