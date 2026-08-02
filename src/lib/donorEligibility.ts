import { prisma } from "@/lib/prisma";

const INTERVAL_HARI = { "Laki-laki": 90, Perempuan: 120 } as const;

export async function cekJarakDonorTerakhir(idPendonor: number, jenisKelamin: string) {
  const riwayatTerakhir = await prisma.riwayatDonor.findFirst({
    where: { id_pendonor: idPendonor, status_donor: "berhasil" },
    orderBy: { tanggal_donor: "desc" },
  });

  if (!riwayatTerakhir) {
    return { layak: true as const };
  }

  const intervalHari = INTERVAL_HARI[jenisKelamin as keyof typeof INTERVAL_HARI] ?? 90;
  const tanggalBolehDonor = new Date(riwayatTerakhir.tanggal_donor);
  tanggalBolehDonor.setDate(tanggalBolehDonor.getDate() + intervalHari);

  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);

  if (hariIni < tanggalBolehDonor) {
    return { layak: false as const, tanggal_boleh_donor: tanggalBolehDonor };
  }

  return { layak: true as const };
}

export type JawabanKuesioner = {
  demam_flu_batuk: boolean;
  sehat_hari_ini: boolean;
  pernah_dirawat: boolean;
  sudah_makan: boolean;
  konsumsi_alkohol: boolean;
  konsumsi_obat: boolean;
  pernah_pingsan_donor: boolean;
  riwayat_jantung_diabetes: boolean;
  riwayat_hepatitis_hiv: boolean;
  hamil_menyusui: boolean;
  baru_operasi: boolean;
  baru_vaksin: boolean;
  bersedia_sukarela: boolean;
};

// PENTING: aturan "Ya mana yang mendiskualifikasi" ini asumsi sementara
// berdasarkan pertanyaan yang wajar secara medis umum — perlu dikonfirmasi
// ke pihak PMI/medis sebelum dipakai sebagai keputusan otomatis final.
export function nilaiKelayakanKuesioner(jawaban: JawabanKuesioner): {
  layak: boolean;
  alasan: string[];
} {
  const alasan: string[] = [];

  if (jawaban.demam_flu_batuk) alasan.push("Sedang demam/flu/batuk/sakit");
  if (!jawaban.sehat_hari_ini) alasan.push("Merasa tidak sehat hari ini");
  if (!jawaban.sudah_makan) alasan.push("Belum makan dalam 3-4 jam terakhir");
  if (jawaban.konsumsi_alkohol) alasan.push("Mengonsumsi alkohol dalam 24 jam terakhir");
  if (jawaban.pernah_pingsan_donor) alasan.push("Pernah pingsan/pusing saat donor sebelumnya");
  if (jawaban.riwayat_jantung_diabetes) alasan.push("Riwayat penyakit jantung/tekanan darah/diabetes");
  if (jawaban.riwayat_hepatitis_hiv) alasan.push("Riwayat hepatitis/HIV/AIDS/penyakit menular darah");
  if (jawaban.hamil_menyusui) alasan.push("Sedang hamil/menyusui");
  if (jawaban.baru_operasi) alasan.push("Baru menjalani operasi/tindakan medis dalam 6 bulan terakhir");
  if (jawaban.baru_vaksin) alasan.push("Baru menerima vaksinasi dalam 1 bulan terakhir");
  if (!jawaban.bersedia_sukarela) alasan.push("Tidak bersedia mendonorkan darah secara sukarela");

  return { layak: alasan.length === 0, alasan };
}