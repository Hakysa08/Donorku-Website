import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

type TokenPayload = {
  id_admin: number;
  email: string;
};

/* =========================================================
   VERIFY TOKEN
========================================================= */

function verifyToken(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as TokenPayload;
  } catch {
    return null;
  }
}

/* =========================================================
   PUT
   UBAH PASSWORD ADMINISTRATOR

   PUT /api/web/auth/dashboard/profile/password

   Body:
   {
     "password_lama": "...",
     "password_baru": "...",
     "konfirmasi_password": "..."
   }
========================================================= */

export async function PUT(req: NextRequest) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const password_lama = String(
      body.password_lama ?? ""
    );

    const password_baru = String(
      body.password_baru ?? ""
    );

    const konfirmasi_password = String(
      body.konfirmasi_password ?? ""
    );

    /* =====================================================
       VALIDASI
    ===================================================== */

    if (
      !password_lama ||
      !password_baru ||
      !konfirmasi_password
    ) {
      return NextResponse.json(
        {
          message:
            "Semua kolom password wajib diisi",
        },
        { status: 400 }
      );
    }

    if (password_baru.length < 8) {
      return NextResponse.json(
        {
          message:
            "Password baru minimal 8 karakter",
        },
        { status: 400 }
      );
    }

    /*
     * Konfirmasi yang tidak cocok memakai status 401
     * supaya tampil pada popup "Password Salah".
     */

    if (
      password_baru !== konfirmasi_password
    ) {
      return NextResponse.json(
        {
          message:
            "Konfirmasi password tidak sama dengan password baru",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       AMBIL PASSWORD LAMA
    ===================================================== */

    const dataAdmin =
      await prisma.admin.findUnique({
        where: {
          id_admin: admin.id_admin,
        },

        select: {
          password: true,
        },
      });

    if (!dataAdmin) {
      return NextResponse.json(
        {
          message:
            "Data administrator tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const cocok = await bcrypt.compare(
      password_lama,
      dataAdmin.password
    );

    if (!cocok) {
      return NextResponse.json(
        {
          message:
            "Password lama yang anda masukan salah",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       SIMPAN PASSWORD BARU
    ===================================================== */

    const hashed = await bcrypt.hash(
      password_baru,
      10
    );

    await prisma.admin.update({
      where: {
        id_admin: admin.id_admin,
      },

      data: {
        password: hashed,
      },
    });

    return NextResponse.json({
      message:
        "Password berhasil diperbarui",
    });
  } catch (error) {
    console.error(
      "UPDATE PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal memperbarui password",

        error:
          process.env.NODE_ENV ===
            "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
