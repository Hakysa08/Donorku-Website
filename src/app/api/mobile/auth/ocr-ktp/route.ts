import { NextRequest, NextResponse } from "next/server";

// TODO: ganti dengan integrasi OCR sungguhan (Google Cloud Vision, AWS Textract,
// atau layanan khusus KTP Indonesia). Fungsi ini kerangka/placeholder dulu,
// supaya alur upload -> ekstrak -> tampilkan bisa dites tanpa nunggu API OCR pilihan Anda.
async function ekstrakDataKTP(fileBuffer: Buffer): Promise<{
  nik: string;
  nama: string;
  tanggal_lahir: string;
  alamat: string;
  golongan_darah: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
}> {
  throw new Error("Integrasi OCR belum dipasang. Lihat komentar TODO di atas.");
}

// NIK Indonesia menyimpan info gender di 2 digit tanggal lahir (posisi ke-7 & ke-8):
// tanggal asli untuk laki-laki, tanggal + 40 untuk perempuan.
// Berguna sebagai validasi silang / fallback kalau OCR gagal baca kolom "Jenis Kelamin" di KTP.
function tentukanJenisKelaminDariNIK(nik: string): "Laki-laki" | "Perempuan" {
  const tanggalDigit = parseInt(nik.slice(6, 8), 10);
  return tanggalDigit > 40 ? "Perempuan" : "Laki-laki";
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("foto_ktp") as File | null;

    if (!file) {
      return NextResponse.json({ message: "Foto KTP wajib diunggah" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Simpan file KTP ke storage (folder uploads / S3 / dsb), dapatkan path/URL-nya
    const fotoKtpPath = `/uploads/ktp/${Date.now()}-${file.name}`;
    // TODO: tulis buffer ke storage sungguhan di sini

    const hasil = await ekstrakDataKTP(buffer);

    return NextResponse.json({
      foto_ktp_path: fotoKtpPath,
      ...hasil,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Gagal memproses foto KTP, silakan coba lagi atau isi manual" },
      { status: 500 }
    );
  }
}