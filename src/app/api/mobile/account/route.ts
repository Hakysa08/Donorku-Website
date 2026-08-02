import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";
import bcrypt from "bcryptjs";

export async function DELETE(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }

  if (!body.password) {
    return NextResponse.json(
      { message: "Password wajib diisi untuk konfirmasi" },
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
        { message: "Akun ini menggunakan login Google/Facebook, tidak bisa dihapus dengan password" },
        { status: 400 }
      );
    }

    // Verifikasi password
    const cocok = await bcrypt.compare(body.password, pendonor.password);
    if (!cocok) {
      return NextResponse.json(
        { message: "Password tidak sesuai" },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.pendonor.update({
      where: { id_pendonor: payload.id_pendonor },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
      },
    });

    return NextResponse.json({ message: "Akun berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal menghapus akun" },
      { status: 500 }
    );
  }
}