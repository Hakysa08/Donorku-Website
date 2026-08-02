/* =========================================================
   FOTO PROFIL ADMIN

   Nilai kolom foto_profil pada tabel admin tidak seragam.

   Contoh isi database:
   - /uploads/profile/1784388077289-20grnl.jpg
   - admin2.jpg
   - null

   Helper ini mengubah semua bentuk di atas menjadi
   satu path yang bisa dipakai langsung oleh <Image />.
========================================================= */

export const FOTO_PROFIL_DEFAULT = "/button/profile.png";

export function fotoProfilAdmin(
  fotoProfil?: string | null
): string {
  const foto = fotoProfil?.trim();

  if (!foto) {
    return FOTO_PROFIL_DEFAULT;
  }

  /*
   * Sudah berupa path lengkap atau URL.
   */
  if (
    foto.startsWith("/") ||
    foto.startsWith("http://") ||
    foto.startsWith("https://")
  ) {
    return foto;
  }

  /*
   * Hanya nama file, jadi dilengkapi foldernya.
   */
  return `/uploads/profile/${foto}`;
}
