import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const nama_lengkap = formData.get("nama_lengkap") as string;
    const email = formData.get("email") as string;
    const no_hp = formData.get("no_hp") as string;
    const kota = formData.get("kota") as string;
    const password = formData.get("password") as string | null;
    const password_confirm = formData.get("password_confirm") as string | null;
    const provider = formData.get("provider") as string | null; // "google" | "facebook" | null
    const provider_id = formData.get("provider_id") as string | null;

    const nik = formData.get("nik") as string;
    const tanggal_lahir = formData.get("tanggal_lahir") as string;
    const alamat = formData.get("alamat") as string;
    const golongan_darah = formData.get("golongan_darah") as string;
    const profesi = formData.get("profesi") as string;
    const foto_ktp_path = formData.get("foto_ktp_path") as string;
    const jenis_kelamin = formData.get("jenis_kelamin") as string;

    const fotoDiri = formData.get("foto_diri") as File | null;

    if (!nama_lengkap || !email || !nik) {
      return NextResponse.json({ message: "Data wajib belum lengkap" }, { status: 400 });
    }

    // Password cuma wajib kalau BUKAN registrasi via OAuth
    if (!provider) {
      if (!password) {
        return NextResponse.json({ message: "Password wajib diisi" }, { status: 400 });
      }
      if (password !== password_confirm) {
        return NextResponse.json({ message: "Konfirmasi password tidak sama" }, { status: 400 });
      }
    }

    const emailSudahAda = await prisma.pendonor.findUnique({ where: { email } });
    if (emailSudahAda) {
      return NextResponse.json({ message: "Email sudah terdaftar" }, { status: 409 });
    }

    const nikSudahAda = await prisma.pendonor.findUnique({ where: { nik } });
    if (nikSudahAda) {
      return NextResponse.json({ message: "NIK sudah terdaftar" }, { status: 409 });
    }

    let fotoProfilPath: string | null = null;
    if (fotoDiri) {
      fotoProfilPath = `/uploads/profil/${Date.now()}-${fotoDiri.name}`;
      // TODO: tulis buffer fotoDiri ke storage sungguhan di sini
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const pendonor = await prisma.pendonor.create({
      data: {
        nama_lengkap,
        email,
        no_hp,
        kota,
        password: hashedPassword,
        nik,
        tanggal_lahir: new Date(tanggal_lahir),
        alamat,
        golongan_darah,
        profesi,
        foto_ktp: foto_ktp_path || null,
        foto_profil: fotoProfilPath,
        jenis_kelamin: jenis_kelamin === "Perempuan" ? "Perempuan" : "Laki_laki", // hasil ekstraksi OCR KTP; "Laki_laki" = nama identifier enum Prisma (garis bawah), tetap tersimpan "Laki-laki" di DB lewat @map
        id_admin: 1, // sengaja hardcode — hanya ada satu admin pusat PMI di sistem ini
        google_id: provider === "google" ? provider_id : null,
        facebook_id: provider === "facebook" ? provider_id : null,
      },
    });

    return NextResponse.json(
      {
        message: "Akun berhasil dibuat",
        pendonor: {
          id_pendonor: pendonor.id_pendonor,
          nama_lengkap: pendonor.nama_lengkap,
          email: pendonor.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Gagal membuat akun" }, { status: 500 });
  }
}