import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { verifikasiFacebookToken } from "@/lib/oauthVerify";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=facebook_gagal`);
  }

  try {
    // 1. Tukar authorization code jadi access_token
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID!,
      redirect_uri: `${baseUrl}/api/web/auth/facebook/callback`,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      code,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`
    );

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=facebook_gagal`);
    }

    const { access_token } = await tokenRes.json();

    // 2. Verifikasi & ambil profil (helper yang sama dipakai versi mobile)
    const profil = await verifikasiFacebookToken(access_token);

    // 3. Cari admin berdasarkan facebook_id ATAU email
    let admin = await prisma.admin.findFirst({
      where: { OR: [{ facebook_id: profil.provider_id }, { email: profil.email }] },
    });

    // Sama seperti Google: TIDAK auto-create admin baru
    if (!admin) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent("Email ini tidak terdaftar sebagai admin")}`
      );
    }

    if (!admin.facebook_id) {
      admin = await prisma.admin.update({
        where: { id_admin: admin.id_admin },
        data: { facebook_id: profil.provider_id },
      });
    }

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
    return NextResponse.redirect(`${baseUrl}/login?error=facebook_gagal`);
  }
}