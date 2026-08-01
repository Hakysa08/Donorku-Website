import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";

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
   GET
   LIST ATURAN DAN TIPS

   GET /api/web/auth/dashboard/aturantips

   Query:
   ?page=1
   &limit=8
   &search=donor
========================================================= */

export async function GET(req: NextRequest) {
  try {
    /* =====================================================
       AUTH
    ===================================================== */

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

    /* =====================================================
       QUERY PARAMETER
    ===================================================== */

    const { searchParams } = new URL(req.url);

    const search =
      searchParams.get("search")?.trim() ?? "";

    const pageRaw = Number(
      searchParams.get("page") ?? "1"
    );

    const limitRaw = Number(
      searchParams.get("limit") ?? "8"
    );

    const page =
      Number.isInteger(pageRaw) && pageRaw > 0
        ? pageRaw
        : 1;

    const limit =
      Number.isInteger(limitRaw) &&
      limitRaw > 0 &&
      limitRaw <= 50
        ? limitRaw
        : 8;

    /* =====================================================
       FILTER
    ===================================================== */

    const where: Prisma.AturanDanTipsWhereInput =
      search
        ? {
            OR: [
              {
                judul: {
                  contains: search,
                },
              },

              {
                kategori: {
                  contains: search,
                },
              },

              {
                isi: {
                  contains: search,
                },
              },
            ],
          }
        : {};

    /* =====================================================
       QUERY DATABASE
    ===================================================== */

    const [total, aturanTips] = await Promise.all([
      prisma.aturanDanTips.count({
        where,
      }),

      prisma.aturanDanTips.findMany({
        where,

        select: {
          id_tips: true,
          judul: true,
          kategori: true,
          status: true,
          isi: true,
          tanggal_dibuat: true,
          tanggal_diubah: true,
        },

        orderBy: {
          id_tips: "asc",
        },

        skip: (page - 1) * limit,

        take: limit,
      }),
    ]);

    /* =====================================================
       PAGINATION
    ===================================================== */

    const totalPages = Math.max(
      1,
      Math.ceil(total / limit)
    );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      message:
        "Data aturan dan tips berhasil diambil",

      data: aturanTips,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET ATURAN TIPS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal mengambil data aturan dan tips",

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
   POST
   TAMBAH ATURAN DAN TIPS

   POST /api/web/auth/dashboard/aturantips
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
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
       INSERT DATABASE
    ===================================================== */

    const aturanTips =
      await prisma.aturanDanTips.create({
        data: {
          id_admin: admin.id_admin,
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

    return NextResponse.json(
      {
        message:
          "Aturan/Tips berhasil ditambahkan",

        data: aturanTips,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "CREATE ATURAN TIPS ERROR:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Gagal menambahkan aturan/tips",

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
