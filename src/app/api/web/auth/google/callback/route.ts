import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { verifikasiGoogleToken } from "@/lib/oauthVerify";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=google_gagal`);
  }

  try {
    // 1. Tukar authorization code jadi id_token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/web/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=google_gagal`);
    }

    const { id_token } = await tokenRes.json();

    // 2. Verifikasi id_token (helper yang sama dipakai versi mobile pendonor)
    const profil = await verifikasiGoogleToken(id_token);

    // 3. Cari admin berdasarkan google_id ATAU email
    let admin = await prisma.admin.findFirst({
      where: { OR: [{ google_id: profil.provider_id }, { email: profil.email }] },
    });

    // PENTING: TIDAK auto-create admin baru lewat Google — cuma ada 1 admin
    // pusat PMI di sistem ini, akun admin cuma dibuat manual, bukan self-register.
    if (!admin) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent("Email ini tidak terdaftar sebagai admin")}`
      );
    }

    if (!admin.google_id) {
      admin = await prisma.admin.update({
        where: { id_admin: admin.id_admin },
        data: { google_id: profil.provider_id },
      });
    }

    // 4. Set cookie "token" sama persis seperti login manual admin
    const token = jwt.sign(
      { id_admin: admin.id_admin, email: admin.email },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(`${baseUrl}/login?error=google_gagal`);
  }
}