import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";

type TokenPayload = {
  id_admin: number;
  email: string;
};

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
   FOTO PATH
========================================================= */

function getFotoPath(id: number) {
  return path.join(
    process.cwd(),
    "public",
    "uploads",
    "lokasi",
    `${id}.jpg`
  );
}

/* =========================================================
   CEK FOTO
========================================================= */

async function fotoExists(id: number) {
  try {
    await fs.access(getFotoPath(id));
    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   GET DETAIL
========================================================= */

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const idLokasi = Number(id);

    if (!Number.isInteger(idLokasi) || idLokasi <= 0) {
      return NextResponse.json(
        {
          message: "ID lokasi tidak valid",
        },
        { status: 400 }
      );
    }

    const lokasi = await prisma.lokasiDonor.findUnique({
      where: {
        id_lokasi: idLokasi,
      },

      select: {
        id_lokasi: true,
        nama_lokasi: true,
        alamat: true,
        kota: true,
        no_hp: true,
        longitude: true,
        latitude: true,
      },
    });

    if (!lokasi) {
      return NextResponse.json(
        {
          message: "Lokasi tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const punyaFoto = await fotoExists(idLokasi);

    return NextResponse.json({
      message: "Detail lokasi berhasil diambil",

      data: {
        ...lokasi,

        foto_url: punyaFoto ? `/uploads/lokasi/${idLokasi}.jpg` : null,
      },
    });
  } catch (error) {
    console.error("GET DETAIL LOKASI ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil detail lokasi",

        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT / EDIT
========================================================= */

export async function PUT(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const idLokasi = Number(id);

    if (!Number.isInteger(idLokasi) || idLokasi <= 0) {
      return NextResponse.json(
        {
          message: "ID lokasi tidak valid",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CEK DATA
    ===================================================== */

    const existing = await prisma.lokasiDonor.findUnique({
      where: {
        id_lokasi: idLokasi,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          message: "Lokasi tidak ditemukan",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       FORMDATA
    ===================================================== */

    const formData = await req.formData();

    const nama_lokasi = String(formData.get("nama_lokasi") ?? "").trim();

    const alamat = String(formData.get("alamat") ?? "").trim();

    const kota = String(formData.get("kota") ?? "").trim();

    const no_hp = String(formData.get("no_hp") ?? "").trim();

    const longitudeRaw = String(formData.get("longitude") ?? "").trim();

    const latitudeRaw = String(formData.get("latitude") ?? "").trim();

    const foto = formData.get("foto");

    /* =====================================================
       VALIDASI
    ===================================================== */

    if (!nama_lokasi || !alamat || !kota || !no_hp) {
      return NextResponse.json(
        {
          message: "Nama lokasi, alamat, kota, dan nomor HP wajib diisi",
        },
        { status: 400 }
      );
    }

    if (!longitudeRaw || !latitudeRaw) {
      return NextResponse.json(
        {
          message: "Longitude dan latitude wajib diisi",
        },
        { status: 400 }
      );
    }

    const longitude = Number(longitudeRaw);

    const latitude = Number(latitudeRaw);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      return NextResponse.json(
        {
          message: "Longitude dan latitude harus berupa angka",
        },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          message: "Longitude harus berada antara -180 sampai 180",
        },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          message: "Latitude harus berada antara -90 sampai 90",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       UPDATE MYSQL
    ===================================================== */

    const lokasi = await prisma.lokasiDonor.update({
      where: {
        id_lokasi: idLokasi,
      },

      data: {
        nama_lokasi,
        alamat,
        kota,
        no_hp,
        longitude,
        latitude,
      },

      select: {
        id_lokasi: true,
        nama_lokasi: true,
        alamat: true,
        kota: true,
        no_hp: true,
        longitude: true,
        latitude: true,
      },
    });

    /* =====================================================
       FOTO BARU

       Kalau user tidak memilih foto:
       foto lama tetap ada.

       Kalau memilih:
       overwrite {id}.jpg
    ===================================================== */

    if (foto instanceof File && foto.size > 0) {
      if (foto.type !== "image/jpeg" && foto.type !== "image/jpg") {
        return NextResponse.json(
          {
            message: "Foto harus berformat JPG/JPEG",
          },
          { status: 400 }
        );
      }

      if (foto.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            message: "Ukuran foto maksimal 5 MB",
          },
          { status: 400 }
        );
      }

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "lokasi"
      );

      await fs.mkdir(uploadDir, {
        recursive: true,
      });

      const bytes = await foto.arrayBuffer();

      await fs.writeFile(getFotoPath(idLokasi), Buffer.from(bytes));
    }

    const punyaFoto = await fotoExists(idLokasi);

    return NextResponse.json({
      message: "Lokasi berhasil diperbarui",

      data: {
        ...lokasi,

        foto_url: punyaFoto ? `/uploads/lokasi/${idLokasi}.jpg` : null,
      },
    });
  } catch (error) {
    console.error("UPDATE LOKASI ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal memperbarui lokasi",

        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE

   Stok darah yang terkait lokasi ini ikut dihapus permanen
   bersamaan dengan lokasinya (dibungkus $transaction).
========================================================= */

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const idLokasi = Number(id);

    if (!Number.isInteger(idLokasi) || idLokasi <= 0) {
      return NextResponse.json(
        {
          message: "ID lokasi tidak valid",
        },
        { status: 400 }
      );
    }

    const lokasi = await prisma.lokasiDonor.findUnique({
      where: {
        id_lokasi: idLokasi,
      },

      select: {
        id_lokasi: true,

        _count: {
          select: {
            jadwal_donor: true,
            stok_darah: true,
          },
        },
      },
    });

    if (!lokasi) {
      return NextResponse.json(
        {
          message: "Lokasi tidak ditemukan",
        },
        { status: 404 }
      );
    }

    /*
     * Jangan hapus lokasi yang
     * masih mempunyai jadwal donor.
     */

    if (lokasi._count.jadwal_donor > 0) {
      return NextResponse.json(
        {
          message:
            "Lokasi tidak dapat dihapus karena masih digunakan oleh jadwal donor",
        },
        { status: 409 }
      );
    }

    /*
     * Stok darah yang terkait lokasi ini
     * ikut dihapus permanen bersamaan
     * dengan lokasinya.
     */

    await prisma.$transaction([
      prisma.stokDarah.deleteMany({
        where: {
          id_lokasi: idLokasi,
        },
      }),

      prisma.lokasiDonor.delete({
        where: {
          id_lokasi: idLokasi,
        },
      }),
    ]);

    /* =====================================================
       HAPUS FOTO
    ===================================================== */

    try {
      await fs.unlink(getFotoPath(idLokasi));
    } catch {
      /*
       * Tidak masalah kalau lokasi
       * memang tidak punya foto.
       */
    }

    return NextResponse.json({
      message: "Lokasi berhasil dihapus",
    });
  } catch (error) {
    console.error("DELETE LOKASI ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal menghapus lokasi",

        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}