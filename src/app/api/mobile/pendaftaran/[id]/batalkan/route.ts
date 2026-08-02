import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const idPendaftaran = parseInt(id, 10);
  if (isNaN(idPendaftaran)) {
    return NextResponse.json(
      { message: "ID pendaftaran tidak valid" },
      { status: 400 }
    );
  }

  try {
    const pendaftaran = await prisma.pendaftaran.findUnique({
      where: { id_pendaftaran: idPendaftaran },
      select: {
        id_pendaftaran: true,
        id_pendonor: true,
        status_pendaftaran: true,
      },
    });
    // 404 kalau tidak ada atau bukan milik pendonor yang login
    if (!pendaftaran || pendaftaran.id_pendonor !== payload.id_pendonor) {
      return NextResponse.json(
        { message: "Pendaftaran tidak ditemukan" },
        { status: 404 }
      );
    }
    // Hanya boleh batalkan kalau masih menunggu
    if (pendaftaran.status_pendaftaran !== "menunggu") {
      const pesanStatus: Record<string, string> = {
        diterima:    "Pendaftaran sudah diterima, tidak bisa dibatalkan. Hubungi petugas jika ada kendala.",
        ditolak:     "Pendaftaran sudah ditolak.",
        dibatalkan:  "Pendaftaran sudah dibatalkan sebelumnya.",
        selesai:     "Donor sudah selesai dilaksanakan.",
        batal_hadir: "Pendaftaran sudah ditandai tidak hadir.",
      };
      return NextResponse.json(
        {
          message:
            pesanStatus[pendaftaran.status_pendaftaran] ??
            "Pendaftaran tidak dapat dibatalkan.",
        },
        { status: 400 }
      );
    }
    await prisma.pendaftaran.update({
      where: { id_pendaftaran: idPendaftaran },
      data: { status_pendaftaran: "dibatalkan" },
    });
    return NextResponse.json({ message: "Pendaftaran berhasil dibatalkan" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal membatalkan pendaftaran" },
      { status: 500 }
    );
  }
}