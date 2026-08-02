export const OPSI_GOLONGAN: readonly string[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

/*
 * Mengembalikan ikon golongan darah sesuai berkas yang ada
 * di /public/blood (contoh: "A-" -> /blood/blood_a-.png).
 */
export function ikonGolongan(golongan: string) {
  const g = golongan.trim().toLowerCase();

  const tersedia = [
    "a+", "a-", "b+", "b-",
    "ab+", "ab-", "o+", "o-",
  ];

  if (tersedia.includes(g)) {
    return `/blood/blood_${g}.png`;
  }

  return "/blood/blood_o+.png";
}

export function pisahGolongan(golongan: string) {
  const cocok = golongan.match(/^(AB|A|B|O)([+-])$/);

  if (!cocok) {
    return { abo: "", rhesus: "" };
  }

  return { abo: cocok[1], rhesus: cocok[2] };
}
