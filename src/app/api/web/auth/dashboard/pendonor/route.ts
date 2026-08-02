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
  if (!token) return null;

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
   LIST DAFTAR PENDONOR (berbasis PENDAFTARAN)

   Satu baris = satu pendaftaran donor, sesuai desain Figma
   (kolom Status, Lokasi Donor, Tanggal Pendonoran).

   GET /api/web/auth/dashboard/pendonor

   Query:
   ?page=1
   &limit=9
   &search=budi            (nama / email pendonor)
   &tanggal=2026-07-31     (tanggal pelaksanaan jadwal)
   &lokasi=IPB             (nama lokasi donor)
   &status=menunggu        (menunggu | diterima | ditolak | dibatalkan | selesai | batal_hadir)
========================================================= */

type StatusPendaftaran =
  | "menunggu"
  | "diterima"
  | "ditolak"
  | "dibatalkan"
  | "selesai"
  | "batal_hadir";

export async function GET(req: NextRequest) {
  try {
    const admin = verifyToken(req);

    if (!admin) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const tanggal = searchParams.get("tanggal")?.trim() ?? "";
    const lokasi = searchParams.get("lokasi")?.trim() ?? "";
    const status = searchParams.get("status")?.trim() ?? "";

    const pageRaw = Number(searchParams.get("page") ?? "1");
    const limitRaw = Number(searchParams.get("limit") ?? "9");

    const page =
      Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    const limit =
      Number.isInteger(limitRaw) &&
      limitRaw > 0 &&
      limitRaw <= 50
        ? limitRaw
        : 9;

    /* =====================================================
       FILTER
    ===================================================== */

    const AND: Prisma.PendaftaranWhereInput[] = [];

    /* Pendonor terhapus (soft delete) tidak ditampilkan. */
    AND.push({ pendonor: { is_deleted: false } });

    /* =====================================================
       HANYA JADWAL DONOR YANG BELUM TERLEWAT

       Daftar Pendonor hanya menampilkan pendaftaran yang
       jadwal donornya belum lewat (belum melakukan donor).
       Kalau HARI pelaksanaannya sudah lewat, atau harinya
       hari ini tapi JAM selesainya sudah lewat, pendaftaran
       tidak lagi ditampilkan di sini.
    ===================================================== */
    const sekarang = new Date();

    const awalHariIni = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth(),
      sekarang.getDate()
    );
    const awalBesok = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth(),
      sekarang.getDate() + 1
    );

    /* Jam sekarang dalam basis 1970-01-01, disamakan dengan
       cara penyimpanan kolom jam_selesai (@db.Time). */
    const pad = (n: number) => String(n).padStart(2, "0");
    const jamSekarang = new Date(
      `1970-01-01T${pad(sekarang.getHours())}:${pad(
        sekarang.getMinutes()
      )}:${pad(sekarang.getSeconds())}`
    );

    AND.push({
      jadwal: {
        is: {
          OR: [
            /* Jadwal di hari-hari berikutnya. */
            { tanggal_pelaksanaan: { gte: awalBesok } },
            /* Jadwal hari ini yang jam selesainya belum lewat. */
            {
              tanggal_pelaksanaan: { gte: awalHariIni, lt: awalBesok },
              jam_selesai: { gte: jamSekarang },
            },
          ],
        },
      },
    });

    /* SEARCH: nama / email pendonor */
    if (search) {
      AND.push({
        OR: [
          { pendonor: { nama_lengkap: { contains: search } } },
          { pendonor: { email: { contains: search } } },
        ],
      });
    }

    /* FILTER LOKASI DONOR */
    if (lokasi) {
      AND.push({ jadwal: { lokasi: { nama_lokasi: lokasi } } });
    }

    /* FILTER TANGGAL PENDONORAN (satu hari) */
    if (tanggal) {
      const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tanggal);

      if (!cocok) {
        return NextResponse.json(
          { message: "Format tanggal tidak valid" },
          { status: 400 }
        );
      }

      const tahun = Number(cocok[1]);
      const bulan = Number(cocok[2]);
      const hari = Number(cocok[3]);

      const awal = new Date(tahun, bulan - 1, hari);
      const akhir = new Date(tahun, bulan - 1, hari + 1);

      AND.push({
        jadwal: {
          tanggal_pelaksanaan: { gte: awal, lt: akhir },
        },
      });
    }

    /* FILTER STATUS */
    const statusValid: StatusPendaftaran[] = [
      "menunggu",
      "diterima",
      "ditolak",
      "dibatalkan",
      "selesai",
      "batal_hadir",
    ];

    if (statusValid.includes(status as StatusPendaftaran)) {
      AND.push({
        status_pendaftaran: status as StatusPendaftaran,
      });
    }

    const where: Prisma.PendaftaranWhereInput = { AND };

    /* =====================================================
       SELECT
    ===================================================== */

    const select = {
      id_pendaftaran: true,
      nomor_antrian: true,
      tanggal_daftar: true,
      status_pendaftaran: true,
      pendonor: {
        select: {
          id_pendonor: true,
          nama_lengkap: true,
          email: true,
          golongan_darah: true,
          jenis_kelamin: true,
          tanggal_lahir: true,
        },
      },
      jadwal: {
        select: {
          tanggal_pelaksanaan: true,
          lokasi: { select: { nama_lokasi: true } },
        },
      },
    } satisfies Prisma.PendaftaranSelect;

    /* =====================================================
       QUERY DATA + COUNT
    ===================================================== */

    const [total, baris] = await Promise.all([
      prisma.pendaftaran.count({ where }),
      prisma.pendaftaran.findMany({
        where,
        select,
        orderBy: { id_pendaftaran: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const data = baris.map((item) => ({
      id: item.id_pendaftaran,
      id_pendonor: item.pendonor.id_pendonor,
      nama_lengkap: item.pendonor.nama_lengkap,
      email: item.pendonor.email,
      golongan_darah: item.pendonor.golongan_darah,
      jenis_kelamin: item.pendonor.jenis_kelamin,
      tanggal_lahir: item.pendonor.tanggal_lahir,
      tanggal_pendonoran:
        item.jadwal.tanggal_pelaksanaan ?? item.tanggal_daftar,
      lokasi_donor: item.jadwal.lokasi.nama_lokasi,
      status: item.status_pendaftaran,
    }));

    /* =====================================================
       OPSI FILTER (dropdown lokasi & tanggal)
    ===================================================== */

    const [lokasiRows, tanggalRows] = await Promise.all([
      prisma.lokasiDonor.findMany({
        select: { nama_lokasi: true },
        orderBy: { nama_lokasi: "asc" },
      }),
      prisma.jadwalDonor.findMany({
        where: { tanggal_pelaksanaan: { not: null } },
        select: { tanggal_pelaksanaan: true },
        distinct: ["tanggal_pelaksanaan"],
        orderBy: { tanggal_pelaksanaan: "desc" },
      }),
    ]);

    const opsiLokasi = Array.from(
      new Set(lokasiRows.map((l) => l.nama_lokasi))
    );

    const opsiTanggal = tanggalRows
      .map((t) => t.tanggal_pelaksanaan)
      .filter((d): d is Date => d !== null)
      .map((d) => d.toISOString().slice(0, 10));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      message: "Data pendaftaran pendonor berhasil diambil",
      data,
      pagination: { page, limit, total, totalPages },
      options: { lokasi: opsiLokasi, tanggal: opsiTanggal },
    });
  } catch (error) {
    console.error("GET DAFTAR PENDONOR ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil data pendaftaran pendonor",
        error:
          process.env.NODE_ENV === "development" &&
          error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  }
}
