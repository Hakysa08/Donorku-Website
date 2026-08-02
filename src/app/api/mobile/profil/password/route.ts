import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  let body: {
    password_sekarang?: string;
    password_baru?: string;
    konfirmasi_password_baru?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }

  const { password_sekarang, password_baru, konfirmasi_password_baru } = body;

  if (!password_sekarang || !password_baru || !konfirmasi_password_baru) {
    return NextResponse.json(
      { message: "Semua field wajib diisi" },
      { status: 400 }
    );
  }

  if (password_baru.length < 8) {
    return NextResponse.json(
      { message: "Password baru minimal 8 karakter" },
      { status: 400 }
    );
  }

  if (password_baru !== konfirmasi_password_baru) {
    return NextResponse.json(
      { message: "Konfirmasi password tidak cocok" },
      { status: 400 }
    );
  }

  try {
    const pendonor = await prisma.pendonor.findUnique({
      where: { id_pendonor: payload.id_pendonor },
      select: { password: true, is_deleted: true },
    });

    if (!pendonor || pendonor.is_deleted) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!pendonor.password) {
      return NextResponse.json(
        { message: "Akun ini tidak menggunakan password. Gunakan login Google/Facebook." },
        { status: 400 }
      );
    }

    // Verifikasi password sekarang
    const cocok = await bcrypt.compare(password_sekarang, pendonor.password);
    if (!cocok) {
      return NextResponse.json(
        { message: "Password saat ini tidak sesuai" },
        { status: 400 }
      );
    }

    // Hash password baru
    const passwordBaru = await bcrypt.hash(password_baru, 12);

    await prisma.pendonor.update({
      where: { id_pendonor: payload.id_pendonor },
      data: { password: passwordBaru },
    });

    return NextResponse.json({ message: "Password berhasil diubah" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengubah password" },
      { status: 500 }
    );
  }
}