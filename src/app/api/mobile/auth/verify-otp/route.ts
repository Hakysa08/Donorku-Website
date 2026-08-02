import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    const pendonor = await prisma.pendonor.findUnique({ where: { email } });
    if (!pendonor || !pendonor.reset_otp || !pendonor.reset_otp_expiry) {
      return NextResponse.json({ message: "Permintaan reset tidak valid" }, { status: 400 });
    }

    if (pendonor.reset_otp !== otp) {
      return NextResponse.json({ message: "Kode OTP salah" }, { status: 400 });
    }

    if (new Date() > pendonor.reset_otp_expiry) {
      return NextResponse.json({ message: "Kode OTP sudah kedaluwarsa" }, { status: 400 });
    }

    return NextResponse.json({ message: "Kode OTP valid" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal memverifikasi kode OTP" }, { status: 500 });
  }
}