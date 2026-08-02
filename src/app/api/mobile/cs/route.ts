// src/app/api/mobile/cs/route.ts
//
// POST /api/mobile/cs
// Header: Authorization: Bearer <token>
// Body: { topik: string, pesan: string }
//
// Kirim email ke support.donorku@gmail.com
// from: noreply@donorku.site (domain Resend terverifikasi)
// reply_to: email pendonor yang login

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getMobileTokenPayload } from "@/lib/mobileAuth";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const payload = getMobileTokenPayload(req);
  if (!payload) {
    return NextResponse.json(
      { message: "Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  let body: { topik?: string; pesan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Body tidak valid" }, { status: 400 });
  }

  const { topik, pesan } = body;
  if (!topik || !pesan) {
    return NextResponse.json(
      { message: "Topik dan pesan wajib diisi" },
      { status: 400 }
    );
  }

  try {
    const pendonor = await prisma.pendonor.findUnique({
      where: { id_pendonor: payload.id_pendonor },
      select: { nama_lengkap: true, email: true, is_deleted: true },
    });

    if (!pendonor || pendonor.is_deleted) {
      return NextResponse.json(
        { message: "Akun tidak ditemukan" },
        { status: 404 }
      );
    }

    await resend.emails.send({
      from: "DonorKu Support <noreply@donorku.site>",
      to: ["support.donorku@gmail.com"],
      replyTo: pendonor.email,
      subject: `[DonorKu] ${topik}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #C0392B;">Pesan dari Pendonor DonorKu</h2>
          <hr style="border: 1px solid #eee;" />
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 120px;">Nama</td>
              <td style="padding: 8px;">: ${pendonor.nama_lengkap}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 8px; font-weight: bold;">Email</td>
              <td style="padding: 8px;">: ${pendonor.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Topik</td>
              <td style="padding: 8px;">: ${topik}</td>
            </tr>
          </table>

          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; border-left: 4px solid #C0392B;">
            <p style="margin: 0; font-weight: bold; margin-bottom: 8px;">Pesan:</p>
            <p style="margin: 0; white-space: pre-wrap;">${pesan}</p>
          </div>

          <hr style="border: 1px solid #eee; margin-top: 24px;" />
          <p style="color: #999; font-size: 12px;">
            Email ini dikirim otomatis dari aplikasi DonorKu.<br/>
            Untuk membalas, klik Reply — balasan akan langsung ke email pendonor.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ message: "Pesan berhasil dikirim" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal mengirim pesan" },
      { status: 500 }
    );
  }
}