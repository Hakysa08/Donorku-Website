"use client";

import FormAturanTips, {
  INITIAL_FORM_ATURAN_TIPS,
} from "@/components/FormAturanTips";

/* =========================================================
   PAGE
========================================================= */

export default function TambahAturanTipsPage() {
  return (
    <FormAturanTips
      judulHalaman="Tambah Aturan & Tips Baru"
      placeholderJudul="Tambahkan Judul Baru Aturan/Tips disini...."
      nilaiAwal={INITIAL_FORM_ATURAN_TIPS}
      endpoint="/api/web/auth/dashboard/aturantips"
      method="POST"
      judulSukses="Aturan/Tips Berhasil Ditambah"
      deskripsiSukses="Anda telah berhasil menambah Aturan/Tips baru. Silahkan coba buka kembali"
    />
  );
}
