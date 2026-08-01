"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import AskModal from "@/components/AskModal";

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

  return (
    <div className="w-full pb-10 pt-6">

      {/* =========================
          HEADER
      ========================== */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tambah Lokasi
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Tambahkan lokasi donor baru
          </p>
        </div>

        {/* BUTTON SEJAJAR DENGAN JUDUL */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowKonfirmasiKembali(true)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-7 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Kembali
          </button>

          <button
            type="submit"
            form="tambah-lokasi-form"
            disabled={loading}
            className="h-11 rounded-xl bg-red-500 px-8 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =========================
          FORM
      ========================== */}
      <form
        id="tambah-lokasi-form"
        onSubmit={handleSubmit}
      >
        <div className="space-y-8">

          {/* =========================
              DETAIL LOKASI
          ========================== */}
          <div>
            <h2 className="mb-5 text-base font-bold text-gray-900">
              Detail Lokasi
            </h2>

            <div className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-3">

              {/* LOKASI DONOR */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Lokasi Donor
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  value={namaLokasi}
                  onChange={(e) => setNamaLokasi(e.target.value)}
                  placeholder="Masukkan lokasi donor"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-red-400"
                />
              </div>

              {/* KOTA */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Kota
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  value={kota}
                  onChange={(e) => setKota(e.target.value)}
                  placeholder="Masukkan kota"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-red-400"
                />
              </div>

              {/* NO PETUGAS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  No Petugas
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="Masukkan nomor petugas"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-red-400"
                />
              </div>

              {/* ALAMAT */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Alamat Lokasi
                  <span className="text-red-500"> *</span>
                </label>

                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Masukkan alamat lokasi"
                  rows={4}
                  required
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-red-400"
                />
              </div>

              {/* LONGITUDE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Longitude
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Contoh: 107.6191"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-red-400"
                />
              </div>

              {/* LATITUDE */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Latitude
                  <span className="text-red-500"> *</span>
                </label>

                <input
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Contoh: -6.9175"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none placeholder:text-gray-300 focus:border-red-400"
                />
              </div>
            </div>
          </div>

          {/* =========================
              FOTO LOKASI
          ========================== */}
          <div>
            <h2 className="mb-4 text-base font-bold text-gray-900">
              Foto Lokasi
            </h2>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg"
                onChange={pilihFoto}
                className="hidden"
              />

              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Foto Lokasi
                <span className="text-red-500"> *</span>
              </label>

              {!preview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-12 w-full max-w-sm items-center rounded-lg border border-gray-200 bg-white text-left text-sm text-gray-400 transition hover:border-gray-300"
                >
                  <span className="flex-1 px-4">
                    Pilih Gambar
                  </span>

                  <span className="flex h-full items-center border-l border-gray-200 bg-gray-100 px-6 text-gray-700">
                    Browse
                  </span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-12 w-full max-w-sm items-center rounded-lg border border-gray-200 bg-white text-left text-sm text-gray-700"
                  >
                    <span className="min-w-0 flex-1 truncate px-4">
                      {foto?.name}
                    </span>

                    <span className="flex h-full items-center border-l border-gray-200 bg-gray-100 px-6">
                      Browse
                    </span>
                  </button>

                  {/* PREVIEW */}
                  <div className="mt-5">
                    <p className="mb-3 text-sm font-medium text-gray-800">
                      Preview
                    </p>

                    <div className="relative h-44 w-64 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                      <Image
                        src={preview}
                        alt="Preview lokasi"
                        fill
                        unoptimized
                        className="object-cover"
                      />

                      <button
                        type="button"
                        onClick={hapusFoto}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>

                    </div>
                  </div>
                </>
              )}

              <p className="mt-2 text-xs text-gray-400">
                Format JPG/JPEG, maksimal 5 MB
              </p>

            </div>
          </div>

        </div>
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
    </div>
  );
}
