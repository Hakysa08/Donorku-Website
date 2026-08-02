import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

export async function GET(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  try {
    const pengaturan = await prisma.pengaturanPendonor.upsert({
      where: { id_pendonor: payload.id_pendonor },
      update: {},
      create: { id_pendonor: payload.id_pendonor },
    });

    return NextResponse.json(pengaturan);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal mengambil data pengaturan" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json({ message: "Silakan login terlebih dahulu" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const dataBolehDiubah: Record<string, unknown> = {};
    if (typeof body.notif_push === "boolean") dataBolehDiubah.notif_push = body.notif_push;
    if (typeof body.notif_email === "boolean") dataBolehDiubah.notif_email = body.notif_email;
    if (typeof body.notif_sms === "boolean") dataBolehDiubah.notif_sms = body.notif_sms;
    if (typeof body.bahasa === "string") dataBolehDiubah.bahasa = body.bahasa;
    if (typeof body.tema === "string") dataBolehDiubah.tema = body.tema;

    const pengaturan = await prisma.pengaturanPendonor.upsert({
      where: { id_pendonor: payload.id_pendonor },
      update: dataBolehDiubah,
      create: { id_pendonor: payload.id_pendonor, ...dataBolehDiubah },
    });

    return NextResponse.json({ message: "Pengaturan berhasil disimpan", pengaturan });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}