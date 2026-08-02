import { prisma } from "@/lib/prisma";

type TipeNotifikasi = "info" | "success" | "warning";

export async function buatNotifikasi(
  id_pendonor: number,
  tipe: TipeNotifikasi,
  judul: string,
  pesan: string
) {
  return prisma.notifikasi.create({
    data: { id_pendonor, tipe, judul, pesan },
  });
}

// Cegah notifikasi duplikat untuk konteks yang sama (misal reminder H-1 jangan
// dikirim berkali-kali kalau cron kebetulan jalan lebih dari sekali di hari yang sama)
export async function sudahAdaNotifikasiHariIni(id_pendonor: number, judul: string) {
  const awalHari = new Date();
  awalHari.setHours(0, 0, 0, 0);

  const existing = await prisma.notifikasi.findFirst({
    where: { id_pendonor, judul, created_at: { gte: awalHari } },
  });

  return existing !== null;
}