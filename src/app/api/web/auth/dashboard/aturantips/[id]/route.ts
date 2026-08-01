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
   KATEGORI DAN STATUS

   Di tampilan status ditulis Aktif / Nonaktif,
   sedangkan di database enumnya publish / draft.
========================================================= */

const KATEGORI = ["Aturan", "Tips"];

const STATUS_DATABASE = {
  Aktif: "publish",
  Nonaktif: "draft",
} as const;

type LabelStatus = keyof typeof STATUS_DATABASE;

function statusKeDatabase(
  status: string
): "publish" | "draft" | null {
  if (status in STATUS_DATABASE) {
    return STATUS_DATABASE[
      status as LabelStatus
    ];
  }

  return null;
}

/* =========================================================
   VALIDASI ID
========================================================= */

function ambilId(id: string): number | null {
  const nomor = Number(id);

  if (
    !Number.isInteger(nomor) ||
    nomor <= 0
  ) {
    return null;
  }

  return nomor;
}

/* =========================================================
   GET
   DETAIL ATURAN DAN TIPS

   GET /api/web/auth/dashboard/aturantips/1
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

    const idTips = ambilId(id);

    if (!idTips) {
      return NextResponse.json(
        {
          message: "ID tidak valid",
        },
        { status: 400 }
      );
    }

    const aturanTips =
      await prisma.aturanDanTips.findUnique({
        where: {
          id_tips: idTips,
        },

        select: {
          id_tips: true,
          judul: true,
          kategori: true,
          status: true,
          isi: true,
          tanggal_dibuat: true,
          tanggal_diubah: true,
        },
      });

    if (!aturanTips) {
      return NextResponse.json(
        {
          message:
            "Aturan/Tips tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        "Detail aturan/tips berhasil diambil",

      data: aturanTips,
    });
  } catch (error) {
    console.error(
      "GET DETAIL ATURAN TIPS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal mengambil detail aturan/tips",

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

/* =========================================================
   PUT
   UBAH ATURAN DAN TIPS

   PUT /api/web/auth/dashboard/aturantips/1
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

    const idTips = ambilId(id);

    if (!idTips) {
      return NextResponse.json(
        {
          message: "ID tidak valid",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const judul = String(
      body.judul ?? ""
    ).trim();

    const kategori = String(
      body.kategori ?? ""
    ).trim();

    const status = String(
      body.status ?? ""
    ).trim();

    const isi = String(
      body.isi ?? ""
    ).trim();

    /* =====================================================
       VALIDASI
    ===================================================== */

    if (!judul || !isi) {
      return NextResponse.json(
        {
          message:
            "Judul dan isi/deskripsi wajib diisi",
        },
        { status: 400 }
      );
    }

    if (!KATEGORI.includes(kategori)) {
      return NextResponse.json(
        {
          message:
            "Kategori harus Aturan atau Tips",
        },
        { status: 400 }
      );
    }

    const statusDatabase =
      statusKeDatabase(status);

    if (!statusDatabase) {
      return NextResponse.json(
        {
          message:
            "Status harus Aktif atau Nonaktif",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       PASTIKAN DATA ADA
    ===================================================== */

    const adaData =
      await prisma.aturanDanTips.findUnique({
        where: {
          id_tips: idTips,
        },

        select: {
          id_tips: true,
        },
      });

    if (!adaData) {
      return NextResponse.json(
        {
          message:
            "Aturan/Tips tidak ditemukan",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

    const aturanTips =
      await prisma.aturanDanTips.update({
        where: {
          id_tips: idTips,
        },

        data: {
          judul,
          kategori,
          status: statusDatabase,
          isi,
        },

        select: {
          id_tips: true,
          judul: true,
          kategori: true,
          status: true,
          isi: true,
          tanggal_dibuat: true,
          tanggal_diubah: true,
        },
      });

    return NextResponse.json({
      message:
        "Aturan/Tips berhasil diperbarui",

      data: aturanTips,
    });
  } catch (error) {
    console.error(
      "UPDATE ATURAN TIPS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal memperbarui aturan/tips",

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

/* =========================================================
   DELETE
   HAPUS ATURAN DAN TIPS

   DELETE /api/web/auth/dashboard/aturantips/1
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

    const idTips = ambilId(id);

    if (!idTips) {
      return NextResponse.json(
        {
          message: "ID tidak valid",
        },
        { status: 400 }
      );
    }

    const adaData =
      await prisma.aturanDanTips.findUnique({
        where: {
          id_tips: idTips,
        },

        select: {
          id_tips: true,
        },
      });

    if (!adaData) {
      return NextResponse.json(
        {
          message:
            "Aturan/Tips tidak ditemukan",
        },
        { status: 404 }
      );
    }

    await prisma.aturanDanTips.delete({
      where: {
        id_tips: idTips,
      },
    });

    return NextResponse.json({
      message:
        "Aturan/Tips berhasil dihapus",
    });
  } catch (error) {
    console.error(
      "DELETE ATURAN TIPS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal menghapus aturan/tips",

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
