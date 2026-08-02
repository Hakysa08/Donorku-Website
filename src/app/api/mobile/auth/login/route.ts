import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email dan password wajib diisi" }, { status: 400 });
    }

    const pendonor = await prisma.pendonor.findUnique({ where: { email } });

    if (!pendonor || pendonor.is_deleted) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    if (!pendonor.password) {
      return NextResponse.json(
        { message: "Akun ini terdaftar via Google/Facebook. Silakan login dengan itu, atau atur password lewat 'Lupa Password'." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, pendonor.password);
    if (!isValid) {
      return NextResponse.json({ message: "Email atau password salah" }, { status: 401 });
    }

    const token = jwt.sign(
      { id_pendonor: pendonor.id_pendonor, email: pendonor.email },
      process.env.JWT_SECRET_MOBILE!,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      message: "Login berhasil",
      access_token: token,
      pendonor: {
        id_pendonor: pendonor.id_pendonor,
        nama_lengkap: pendonor.nama_lengkap,
        email: pendonor.email,
        foto_profil: pendonor.foto_profil,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Terjadi kesalahan server" }, { status: 500 });
  }
}