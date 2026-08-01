import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

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
   GET
   PROFIL ADMINISTRATOR

   GET /api/web/auth/dashboard/profile
========================================================= */

export async function GET(req: NextRequest) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const profil = await prisma.admin.findUnique({
      where: {
        id_admin: admin.id_admin,
      },

      select: {
        id_admin: true,
        nama_admin: true,
        email: true,
        no_hp: true,
        alamat: true,
        foto_profil: true,
      },
    });

    if (!profil) {
      return NextResponse.json(
        {
          message:
            "Data administrator tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      message:
        "Data administrator berhasil diambil",

      data: profil,
    });
  } catch (error) {
    console.error(
      "GET PROFIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal mengambil data administrator",

        error:
          process.env.NODE_ENV ===
            "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT
   UBAH PROFIL ADMINISTRATOR

   PUT /api/web/auth/dashboard/profile

   Dikirim sebagai FormData karena ada foto profil.
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

    /* =====================================================
       AMBIL FORMDATA
    ===================================================== */

    const formData = await req.formData();

    const nama_admin = String(
      formData.get("nama_admin") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    ).trim();

    const no_hp = String(
      formData.get("no_hp") ?? ""
    ).trim();

    const alamat = String(
      formData.get("alamat") ?? ""
    ).trim();

    const foto = formData.get("foto");

    /* =====================================================
       VALIDASI
    ===================================================== */

    if (!nama_admin || !email) {
      return NextResponse.json(
        {
          message:
            "Nama lengkap dan email wajib diisi",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        {
          message:
            "Format email tidak valid",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       EMAIL TIDAK BOLEH DIPAKAI ADMIN LAIN
    ===================================================== */

    const emailTerpakai =
      await prisma.admin.findFirst({
        where: {
          email,

          NOT: {
            id_admin: admin.id_admin,
          },
        },

        select: {
          id_admin: true,
        },
      });

    if (emailTerpakai) {
      return NextResponse.json(
        {
          message:
            "Email sudah digunakan administrator lain",
        },
        { status: 409 }
      );
    }

    /* =====================================================
       VALIDASI FOTO
    ===================================================== */

    let fotoFile: File | null = null;

    if (foto instanceof File && foto.size > 0) {
      if (
        foto.type !== "image/jpeg" &&
        foto.type !== "image/jpg" &&
        foto.type !== "image/png"
      ) {
        return NextResponse.json(
          {
            message:
              "Foto profil harus berformat JPG/JPEG/PNG",
          },
          { status: 400 }
        );
      }

      // Maksimal 5 MB
      if (foto.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            message:
              "Ukuran foto maksimal 5 MB",
          },
          { status: 400 }
        );
      }

      fotoFile = foto;
    }

    /* =====================================================
       SIMPAN FOTO

       Disimpan pada:
       public/uploads/profile
    ===================================================== */

    let fotoProfil: string | undefined;

    if (fotoFile) {
      const fs = await import("fs/promises");
      const path = await import("path");

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "profile"
      );

      await fs.mkdir(uploadDir, {
        recursive: true,
      });

      const ekstensi =
        fotoFile.type === "image/png"
          ? "png"
          : "jpg";

      const namaFile = `${admin.id_admin}-${Date.now()}.${ekstensi}`;

      const bytes =
        await fotoFile.arrayBuffer();

      const buffer = Buffer.from(bytes);

      await fs.writeFile(
        path.join(uploadDir, namaFile),
        buffer
      );

      fotoProfil = `/uploads/profile/${namaFile}`;
    }

    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

    const profil = await prisma.admin.update({
      where: {
        id_admin: admin.id_admin,
      },

      data: {
        nama_admin,
        email,
        no_hp: no_hp || null,
        alamat: alamat || null,

        ...(fotoProfil
          ? { foto_profil: fotoProfil }
          : {}),
      },

      select: {
        id_admin: true,
        nama_admin: true,
        email: true,
        no_hp: true,
        alamat: true,
        foto_profil: true,
      },
    });

    return NextResponse.json({
      message:
        "Profil administrator berhasil diperbarui",

      data: profil,
    });
  } catch (error) {
    console.error(
      "UPDATE PROFIL ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal memperbarui profil administrator",

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
