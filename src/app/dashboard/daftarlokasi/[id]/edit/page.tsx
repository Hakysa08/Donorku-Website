"use client";

import {
  use,
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Save } from "lucide-react";

type Lokasi = {
  id_lokasi: number;
  nama_lokasi: string;
  alamat: string;
  kota: string;
  no_hp: string | null;
  longitude: string | number | null;
  latitude: string | number | null;
  foto_url: string | null;
};

export default function EditLokasiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [namaLokasi, setNamaLokasi] = useState("");
  const [kota, setKota] = useState("");
  const [noHp, setNoHp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");

  const [foto, setFoto] = useState<File | null>(null);

  const [fotoLama, setFotoLama] =
    useState<string | null>(null);

  // true kalau user menghapus foto lama (tanpa pilih foto baru)
  const [hapusFotoLama, setHapusFotoLama] = useState(false);

  const [preview, setPreview] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // modal preview foto (lightbox)
  const [showLightbox, setShowLightbox] = useState(false);

  /* =====================================================
     AMBIL DATA
  ===================================================== */

  useEffect(() => {
    async function ambilDetail() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/web/auth/dashboard/daftarlokasi/${id}`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              result.message ||
              "Gagal mengambil lokasi"
          );
        }

        const data: Lokasi = result.data;

        setNamaLokasi(data.nama_lokasi);
        setKota(data.kota);
        setNoHp(data.no_hp ?? "");
        setAlamat(data.alamat);

        setLongitude(
          data.longitude !== null
            ? String(data.longitude)
            : ""
        );

        setLatitude(
          data.latitude !== null
            ? String(data.latitude)
            : ""
        );

        setFotoLama(data.foto_url);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan"
        );
      } finally {
        setLoading(false);
      }
    }

    ambilDetail();
  }, [id]);

  /* =====================================================
     PILIH FOTO
  ===================================================== */

  function pilihFoto(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
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

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setError("");
    setFoto(file);
    setHapusFotoLama(false);
    setPreview(URL.createObjectURL(file));
  }

  // tombol tempat sampah di preview: hapus foto (baru ATAU lama)
  function hapusFotoTampilan() {
    if (preview) {
      // ada foto baru yang lagi dipreview -> batalkan pilihan itu
      URL.revokeObjectURL(preview);
      setFoto(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // yang ditampilkan foto lama -> tandai buat dihapus pas simpan
    setFotoLama(null);
    setHapusFotoLama(true);
  }

  const fotoDitampilkan = preview ?? fotoLama;

  /* =====================================================
     SUBMIT
  ===================================================== */

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      setSaving(true);
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
      } else if (hapusFotoLama) {
        formData.append("hapus_foto", "1");
      }

      const response = await fetch(
        `/api/web/auth/dashboard/daftarlokasi/${id}`,
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Gagal memperbarui lokasi"
        );
      }

      router.push(
        `/dashboard/daftarlokasi/${id}`
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-400">
        Memuat lokasi...
      </div>
    );
  }

  return (
    <div className="w-full px-10 pb-10 pt-6 text-black">

      {/* =========================
          HEADER: judul kiri satu baris,
          tombol Kembali + Simpan kanan, sejajar
      ========================== */}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Lokasi ID {id}
        </h1>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <img src="/button/back.png" alt="Kembali" width={16} height={16} />
            Kembali
          </button>

          <button
            type="submit"
            form="edit-lokasi-form"
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-full bg-[#ff2938] px-5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
          >
            <img src="/button/save.png" alt="Simpan" width={15} height={15} />
            {saving ? "Menyimpan..." : "Simpan"}
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
        id="edit-lokasi-form"
        onSubmit={handleSubmit}
      >
        <div className="space-y-8">

          {/* =========================
              DETAIL LOKASI
          ========================== */}

          <div>
            <h2 className="mb-4 text-base font-bold text-gray-900">
              Detail Lokasi
            </h2>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">

                <Field
                  label="Lokasi Donor"
                  value={namaLokasi}
                  onChange={setNamaLokasi}
                />

                <Field
                  label="Kota"
                  value={kota}
                  onChange={setKota}
                />

                <Field
                  label="No Hp"
                  value={noHp}
                  onChange={setNoHp}
                />

                {/* ALAMAT */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Alamat Lokasi
                    <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    value={alamat}
                    onChange={(e) =>
                      setAlamat(e.target.value)
                    }
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-red-400"
                  />
                </div>

                <Field
                  label="Longitude"
                  value={longitude}
                  onChange={setLongitude}
                />

                <Field
                  label="Latitude"
                  value={latitude}
                  onChange={setLatitude}
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

            <div className="rounded-2xl border border-gray-200 bg-white p-6">

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg"
                onChange={pilihFoto}
                className="hidden"
              />

              <label className="mb-2 block text-sm font-semibold text-gray-800">
                Foto Lokasi
                <span className="text-red-500">*</span>
              </label>

              {/* FILE SELECTOR */}
              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex h-12 w-full max-w-sm items-center rounded-lg border border-gray-200 bg-white text-left text-sm text-gray-700 transition hover:border-gray-300"
              >
                <span className="min-w-0 flex-1 truncate px-4 text-gray-400">
                  {foto ? foto.name : "Pilih Gambar"}
                </span>

                <span className="flex h-full items-center border-l border-gray-200 bg-gray-100 px-6 text-gray-700">
                  Browse
                </span>
              </button>

              <p className="mt-2 text-xs text-gray-400">
                Format JPG/JPEG, maksimal 5 MB
              </p>

              {/* =========================
                  PREVIEW FOTO
              ========================== */}

              {fotoDitampilkan && (
                <div className="mt-5">

                  <p className="mb-3 text-sm font-medium text-gray-800">
                    Preview
                  </p>

                  <div className="relative h-44 w-64 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">

                    <Image
                      src={
                        preview
                          ? preview
                          : `${fotoDitampilkan}?v=${Date.now()}`
                      }
                      alt="Foto lokasi"
                      fill
                      unoptimized
                      className="object-cover"
                    />

                    <div className="absolute right-2 top-2 flex gap-1.5">
                      {/* LIHAT FOTO (popup) */}
                      <button
                        type="button"
                        title="Lihat foto"
                        onClick={() => setShowLightbox(true)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow hover:bg-gray-50"
                      >
                        <Image
                          src="/button/view.png"
                          alt="Lihat"
                          width={16}
                          height={16}
                        />
                      </button>

                      {/* HAPUS FOTO */}
                      <button
                        type="button"
                        title="Hapus foto"
                        onClick={hapusFotoTampilan}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow hover:bg-red-600"
                      >
                        <Image
                          src="/button/delete.png"
                          alt="Hapus"
                          width={16}
                          height={16}
                        />
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </form>

      {/* =========================
          MODAL POPUP FOTO
      ========================== */}

      {showLightbox && fotoDitampilkan && (
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
              <Image
                src="/button/close.png"
                alt="Tutup"
                width={16}
                height={16}
              />
            </button>

            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <Image
                src={
                  preview
                    ? preview
                    : `${fotoDitampilkan}?v=${Date.now()}`
                }
                alt="Foto lokasi"
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

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-800">
        {label}
        <span className="text-red-500">*</span>
      </label>

      <input
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none focus:border-red-400"
      />
    </div>
  );
}
