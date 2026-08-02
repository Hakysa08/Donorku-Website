import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

export async function POST(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  let body: { rating?: number; saran_keluhan?: string; id_pendaftaran?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }

  const { rating, saran_keluhan, id_pendaftaran } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json(
      { message: "Rating wajib diisi (1-5)" },
      { status: 400 }
    );
  }

  try {
    await prisma.feedback.create({
      data: {
        id_pendonor: payload.id_pendonor,
        rating,
        saran_keluhan: saran_keluhan?.trim() || null,
        id_pendaftaran: id_pendaftaran ?? null,
      },
    });

    return NextResponse.json({ message: "Feedback berhasil dikirim" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengirim feedback" },
      { status: 500 }
    );
  }
}