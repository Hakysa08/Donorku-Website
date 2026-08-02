"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Eye, Save, Trash2 } from "lucide-react";
import AskModal from "@/components/AskModal";

/* =========================================================
   STYLE & SUBKOMPONEN
========================================================= */

const inputClass =
  "h-14 w-full rounded-xl border border-gray-200 bg-white px-6 text-lg text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 mt-9 text-xl font-bold text-gray-900 first:mt-0">
      {children}
    </h2>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7">
      {children}
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2.5 block text-lg font-semibold text-gray-800">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function TambahLokasiPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [namaLokasi, setNamaLokasi] = useState("");
  const [kota, setKota] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");

  const [foto, setFoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // modal konfirmasi sebelum benar-benar submit
  const [showKonfirmasiTambah, setShowKonfirmasiTambah] = useState(false);

  // modal konfirmasi sebelum membatalkan/kembali
  const [showKonfirmasiKembali, setShowKonfirmasiKembali] = useState(false);

  // modal preview foto (lightbox)
  const [showLightbox, setShowLightbox] = useState(false);

  function pilihFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.type !== "image/jpeg") {
      setError("Foto harus berformat JPG/JPEG");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB");
      e.target.value = "";
      return;
    }

    setError("");
    setFoto(file);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(URL.createObjectURL(file));
  }

  function hapusFoto() {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFoto(null);
    setPreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // dipanggil pas form di-submit -> BUKAN langsung kirim ke server,
  // tapi buka modal konfirmasi dulu
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowKonfirmasiTambah(true);
  }

  // ini yang beneran kirim data ke server, dipanggil dari tombol
  // "Tambah" di modal konfirmasi
  async function simpanLokasi() {
    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      formData.append("nama_lokasi", namaLokasi);
      formData.append("kota", kota);
      formData.append("no_hp", noHp);
      formData.append("alamat", alamat);
      formData.append("longitude", longitude);
      formData.append("latitude", latitude);

      if (foto) {
        formData.append("foto", foto);
      }

      const response = await fetch(
        "/api/web/auth/dashboard/daftarlokasi",
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Gagal menambahkan lokasi"
        );
      }

      router.push("/dashboard/daftarlokasi");
      router.refresh();
    } catch (err) {
      setShowKonfirmasiTambah(false);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      <form id="tambah-lokasi-form" onSubmit={handleSubmit}>
        <div className="mb-9 flex items-center justify-between">
          <h1 className="text-[43px] font-bold tracking-tight">
            Tambah Lokasi
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowKonfirmasiKembali(true)}
              className="flex h-[53px] items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-7 text-base font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <ArrowLeft size={19} />
              Kembali
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex h-[53px] items-center justify-center gap-2 rounded-xl bg-red-500 px-8 text-base font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={19} />
              {loading ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-7 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-base text-red-600">
            {error}
          </div>
        )}

        <SectionTitle>Detail Lokasi</SectionTitle>

        <Card>
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Lokasi Donor" required>
              <input
                type="text"
                value={namaLokasi}
                onChange={(e) => setNamaLokasi(e.target.value)}
                placeholder="Masukkan lokasi donor"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Kota" required>
              <input
                type="text"
                value={kota}
                onChange={(e) => setKota(e.target.value)}
                placeholder="Masukkan kota tempat donor"
                required
                className={inputClass}
              />
            </Field>

            <Field label="No Petugas" required>
              <input
                type="text"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="Masukkan no telepon petugas"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Alamat Lokasi" required>
              <textarea
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                placeholder="Masukkan alamat lokasi"
                rows={4}
                required
                className="w-full resize-none rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-lg text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </Field>

            <Field label="Longitude" required>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="Masukkan longitude"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Latitude" required>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="Masukkan latitude"
                required
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <SectionTitle>Foto Lokasi</SectionTitle>

        <Card>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,image/jpeg"
            onChange={pilihFoto}
            className="hidden"
          />

          <label className="mb-2.5 block text-lg font-semibold text-gray-800">
            Foto Lokasi
            <span className="text-red-500"> *</span>
          </label>

          {!preview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-14 w-full max-w-md items-center rounded-xl border border-gray-200 bg-white text-left text-lg text-gray-400 transition hover:border-gray-300"
            >
              <span className="flex-1 px-5">Pilih Gambar</span>
              <span className="flex h-full items-center rounded-r-xl border-l border-gray-200 bg-gray-100 px-7 text-gray-700">
                Browse
              </span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-14 w-full max-w-md items-center rounded-xl border border-gray-200 bg-white text-left text-lg text-gray-700 transition hover:border-gray-300"
              >
                <span className="min-w-0 flex-1 truncate px-5">
                  {foto?.name}
                </span>
                <span className="flex h-full items-center rounded-r-xl border-l border-gray-200 bg-gray-100 px-7 text-gray-700">
                  Browse
                </span>
              </button>

              {/* PREVIEW */}
              <div className="mt-5">
                <p className="mb-3.5 text-lg font-medium text-gray-800">
                  Preview
                </p>

                <div className="group relative aspect-square w-44 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <Image
                    src={preview}
                    alt="Preview lokasi"
                    fill
                    unoptimized
                    className="object-cover"
                  />

                  <div className="absolute right-2 top-2 flex gap-1.5">
                    {/* LIHAT FOTO */}
                    <button
                      type="button"
                      title="Lihat foto"
                      onClick={() => setShowLightbox(true)}
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-gray-700 shadow hover:bg-white"
                    >
                      <Eye size={17} />
                    </button>

                    {/* HAPUS FOTO */}
                    <button
                      type="button"
                      title="Hapus foto"
                      onClick={hapusFoto}
                      className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white shadow hover:bg-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <p className="mb-5 mt-2.5 text-sm text-gray-400">
            Format JPG/JPEG, maksimal 1 gambar, 5 MB.
          </p>
        </Card>
      </form>

      {/* =========================
          MODAL KONFIRMASI TAMBAH
      ========================== */}
      <AskModal
        isOpen={showKonfirmasiTambah}
        variant="tanya"
        title="Konfirmasi Tambah"
        description="Apakah anda yakin ingin menambah lokasi donor baru?"
        buttonLabel={loading ? "Menyimpan..." : "Tambah"}
        cancelLabel="Batal"
        onClose={() => {
          if (!loading) setShowKonfirmasiTambah(false);
        }}
        onConfirm={simpanLokasi}
      />

      {/* =========================
          MODAL KONFIRMASI KEMBALI
      ========================== */}
      <AskModal
        isOpen={showKonfirmasiKembali}
        variant="tanya"
        title="Konfirmasi Kembali"
        description="Apakah anda yakin ingin kembali? (Data tidak akan tersimpan)"
        buttonLabel="Kembali"
        cancelLabel="Batal"
        onClose={() => setShowKonfirmasiKembali(false)}
        onConfirm={() => router.back()}
      />

      {/* =========================
          MODAL POPUP FOTO
      ========================== */}

      {showLightbox && preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white"
            >
              ✕
            </button>

            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <Image
                src={preview}
                alt="Preview lokasi"
                fill
                unoptimized
                className="bg-black object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
