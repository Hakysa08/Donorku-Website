import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password_baru } = await req.json();

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin || !admin.reset_otp || !admin.reset_otp_expiry) {
      return NextResponse.json({ message: "Permintaan reset tidak valid" }, { status: 400 });
    }

    if (admin.reset_otp !== otp) {
      return NextResponse.json({ message: "Kode OTP salah" }, { status: 400 });
    }

    if (new Date() > admin.reset_otp_expiry) {
      return NextResponse.json({ message: "Kode OTP sudah kedaluwarsa" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password_baru, 10);

    await prisma.admin.update({
      where: { email },
      data: {
        password: hashed,
        reset_otp: null,
        reset_otp_expiry: null, 
      },
    });

    return NextResponse.json({ message: "Password berhasil direset" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal mereset password" }, { status: 500 });
  }
}