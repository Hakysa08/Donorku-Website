"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, Save, Trash2, X } from "lucide-react";

import AskModal from "@/components/AskModal";
import BackButton from "@/components/BackButton";

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

const inputClass =
  "h-14 w-full rounded-xl border border-gray-200 bg-white px-6 text-lg text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100";

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
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 mt-9 text-xl font-bold text-gray-900 first:mt-0">
      {children}
    </h2>
  );
}

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

  const [fotoLama, setFotoLama] = useState<string | null>(null);

  // true kalau user menghapus foto lama (tanpa pilih foto baru)
  const [hapusFotoLama, setHapusFotoLama] = useState(false);

  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // modal preview foto (lightbox)
  const [showLightbox, setShowLightbox] = useState(false);

  // modal konfirmasi aksi
  const [showKonfirmasiEdit, setShowKonfirmasiEdit] = useState(false);
  const [showKonfirmasiKembali, setShowKonfirmasiKembali] = useState(false);

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
            result.error || result.message || "Gagal mengambil lokasi"
          );
        }

        const data: Lokasi = result.data;

        setNamaLokasi(data.nama_lokasi);
        setKota(data.kota);
        setNoHp(data.no_hp ?? "");
        setAlamat(data.alamat);

        setLongitude(
          data.longitude !== null ? String(data.longitude) : ""
        );

        setLatitude(
          data.latitude !== null ? String(data.latitude) : ""
        );

        setFotoLama(data.foto_url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      } finally {
        setLoading(false);
      }
    }

    ambilDetail();
  }, [id]);

  /* =====================================================
     PILIH FOTO
  ===================================================== */

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
     SUBMIT: form munculin modal "Konfirmasi Edit" dulu,
     proses simpan sebenarnya ada di prosesEdit()
  ===================================================== */

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setShowKonfirmasiEdit(true);
  }

  async function prosesEdit() {
    try {
      setSaving(true);
      setError("");
      setShowKonfirmasiEdit(false);

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
          result.error || result.message || "Gagal memperbarui lokasi"
        );
      }

      // setelah sukses -> ke halaman Daftar Lokasi (list), bukan detail/preview
      router.push("/dashboard/daftarlokasi");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mt-7 h-96 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      {/* =========================
          HEADER: judul kiri satu baris,
          tombol Kembali + Simpan kanan, sejajar
      ========================== */}

      <div className="mb-9 flex items-start justify-between">
        <h1 className="text-[43px] font-bold tracking-tight">
          Edit Lokasi ID {id}
        </h1>

        <div className="flex items-center gap-3">
          <BackButton
            onClick={() => setShowKonfirmasiKembali(true)}
          />

          <button
            type="submit"
            form="edit-lokasi-form"
            disabled={saving}
            className="flex h-[53px] items-center gap-2 rounded-full bg-[#ff2938] px-7 text-base font-semibold text-white hover:bg-red-600 disabled:opacity-50"
          >
            <Save size={19} />
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-7 rounded-xl bg-red-50 px-5 py-3.5 text-base text-red-600">
          {error}
        </div>
      )}

      {/* =========================
          FORM
      ========================== */}

      <form
        id="edit-lokasi-form"
        onSubmit={handleFormSubmit}
        className="pb-10"
      >
        <SectionTitle>Detail Lokasi</SectionTitle>
        <Card>
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-3">
            <Field label="Lokasi Donor" required>
              <input
                value={namaLokasi}
                onChange={(e) => setNamaLokasi(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Kota" required>
              <input
                value={kota}
                onChange={(e) => setKota(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="No Hp" required>
              <input
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="md:col-span-3">
              <Field label="Alamat Lokasi" required>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-lg text-gray-800 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </Field>
            </div>

            <Field label="Longitude" required>
              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Latitude" required>
              <input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
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

          <Field label="Foto Lokasi" required>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-14 w-full max-w-md items-center rounded-xl border border-gray-200 bg-white text-left text-lg text-gray-400 transition hover:border-gray-300"
            >
              <span className="flex-1 truncate px-5">
                {foto ? foto.name : "Pilih Gambar"}
              </span>
              <span className="flex h-full items-center rounded-r-xl border-l border-gray-200 bg-gray-100 px-7 text-gray-700">
                Browse
              </span>
            </button>
          </Field>

          {/* PREVIEW FOTO */}
          {fotoDitampilkan && (
            <div className="mt-6">
              <p className="mb-3.5 text-lg font-medium text-gray-800">
                Preview
              </p>

              <div className="group relative aspect-square w-44 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <Image
                  src={
                    preview ? preview : `${fotoDitampilkan}?v=${Date.now()}`
                  }
                  alt="Foto lokasi"
                  fill
                  unoptimized
                  className="object-cover"
                />

                <div className="absolute right-2 top-2 flex gap-1.5">
                  <button
                    type="button"
                    title="Lihat"
                    onClick={() => setShowLightbox(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-gray-700 shadow hover:bg-white"
                  >
                    <Eye size={17} />
                  </button>

                  <button
                    type="button"
                    title="Hapus"
                    onClick={hapusFotoTampilan}
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white shadow hover:bg-red-600"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
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
              <X size={18} />
            </button>

            <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
              <Image
                src={
                  preview ? preview : `${fotoDitampilkan}?v=${Date.now()}`
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

      {/* =========================
          MODAL KONFIRMASI
      ========================== */}

      <AskModal
        isOpen={showKonfirmasiEdit}
        variant="tanya"
        title="Konfirmasi Edit"
        description="Apakah anda yakin ingin mengubah lokasi donor?"
        buttonLabel="Edit"
        cancelLabel="Batal"
        onClose={() => setShowKonfirmasiEdit(false)}
        onConfirm={prosesEdit}
      />

      <AskModal
        isOpen={showKonfirmasiKembali}
        variant="tanya"
        title="Konfirmasi Kembali"
        description="Apakah anda yakin ingin kembali? (Data tidak akan teredit)"
        buttonLabel="Kembali"
        cancelLabel="Batal"
        onClose={() => setShowKonfirmasiKembali(false)}
        onConfirm={() => router.back()}
      />
    </div>
  );
}
