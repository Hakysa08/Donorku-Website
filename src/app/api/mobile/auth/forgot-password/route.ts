import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const pendonor = await prisma.pendonor.findUnique({ where: { email } });
    if (!pendonor || pendonor.is_deleted) {
      return NextResponse.json({ message: "Email tidak ditemukan" }, { status: 404 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.pendonor.update({
      where: { email },
      data: { reset_otp: otp, reset_otp_expiry: expiry },
    });

    await sendOtpEmail(email, otp);

    return NextResponse.json({ message: "Kode OTP telah dikirim ke email kamu" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal mengirim kode OTP" }, { status: 500 });
  }
}