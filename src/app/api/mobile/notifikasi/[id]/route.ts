import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notif = await prisma.notifikasi.findUnique({ where: { id_notifikasi: Number(id) } });
    if (!notif || notif.id_pendonor !== payload.id_pendonor) {
      return NextResponse.json({ message: "Notifikasi tidak ditemukan" }, { status: 404 });
    }

    await prisma.notifikasi.update({
      where: { id_notifikasi: Number(id) },
      data: { is_read: true },
    });

    return NextResponse.json({ message: "Notifikasi ditandai sudah dibaca" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memperbarui notifikasi" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const notif = await prisma.notifikasi.findUnique({ where: { id_notifikasi: Number(id) } });
    if (!notif || notif.id_pendonor !== payload.id_pendonor) {
      return NextResponse.json({ message: "Notifikasi tidak ditemukan" }, { status: 404 });
    }

    await prisma.notifikasi.delete({ where: { id_notifikasi: Number(id) } });

    return NextResponse.json({ message: "Notifikasi dihapus" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menghapus notifikasi" }, { status: 500 });
  }
}