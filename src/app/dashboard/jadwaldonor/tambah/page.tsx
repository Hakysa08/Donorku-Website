// LABEL FILE: app/dashboard/jadwaldonor/tambah/page.tsx

"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { Eye, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

// SESUAIKAN PATH INI kalau lokasi komponennya beda
import AskModal from "@/components/AskModal";
import BackButton from "@/components/BackButton";

/* =========================================================
   TYPE
========================================================= */

type Lokasi = {
  id_lokasi: number;
  nama_lokasi: string;
  alamat: string;
  kota: string;
};

type FormDataJadwal = {
  tanggal_pelaksanaan: string;
  jam_mulai: string;
  jam_selesai: string;
  id_lokasi: string;
  nama_penanggung_jawab: string;
  kontak_penanggung_jawab: string;
  kuota: string;
  total_pendaftar_online: string;
  total_pendonor_offline: string;
  pendonor_hadir: string;
  darah_terkumpul: string;
};

const INITIAL_FORM: FormDataJadwal = {
  tanggal_pelaksanaan: "",
  jam_mulai: "",
  jam_selesai: "",
  id_lokasi: "",
  nama_penanggung_jawab: "",
  kontak_penanggung_jawab: "",
  kuota: "",
  total_pendaftar_online: "",
  total_pendonor_offline: "",
  pendonor_hadir: "",
  darah_terkumpul: "",
};

type Slot = {
  key: string;
  url: string;
  file: File;
};

const MAX_FOTO = 5;

/* =========================================================
   PAGE
========================================================= */

export default function TambahJadwalPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormDataJadwal>(INITIAL_FORM);

  const [lokasi, setLokasi] = useState<Lokasi[]>([]);
  const [loadingLokasi, setLoadingLokasi] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [showKonfirmasiTambah, setShowKonfirmasiTambah] = useState(false);
  const [showKonfirmasiKembali, setShowKonfirmasiKembali] = useState(false);

  /* =======================================================
     AMBIL DATA LOKASI
  ======================================================= */

  useEffect(() => {
    async function ambilLokasi() {
      try {
        setLoadingLokasi(true);

        const response = await fetch(
          "/api/web/auth/dashboard/daftarlokasi?page=1&limit=50",
          { credentials: "include", cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil lokasi");
        }

        setLokasi(result.data ?? []);
      } catch (error) {
        console.error("GET LOKASI ERROR:", error);
        setError(
          error instanceof Error ? error.message : "Gagal mengambil lokasi"
        );
      } finally {
        setLoadingLokasi(false);
      }
    }

    ambilLokasi();
  }, []);

  const lokasiTerpilih = lokasi.find(
    (item) => String(item.id_lokasi) === form.id_lokasi
  );

  function handleChange(
    event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  /* =======================================================
     FOTO (multi, max 5)
  ======================================================= */

  function handleTambahFoto(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const sisaSlot = MAX_FOTO - slots.length;

    if (sisaSlot <= 0) {
      setError(`Foto lokasi maksimal ${MAX_FOTO} gambar`);
      event.target.value = "";
      return;
    }

    const filesDipakai = files.slice(0, sisaSlot);

    for (const file of filesDipakai) {
      if (file.type !== "image/jpeg") {
        setError("Foto harus berformat JPG/JPEG");
        event.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran tiap foto maksimal 5 MB");
        event.target.value = "";
        return;
      }
    }

    setError("");

    const slotBaru: Slot[] = filesDipakai.map((file) => ({
      key: `${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setSlots((prev) => [...prev, ...slotBaru]);
    event.target.value = "";
  }

  function hapusFoto(key: string) {
    setSlots((prev) => {
      const target = prev.find((s) => s.key === key);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((s) => s.key !== key);
    });
  }

  useEffect(() => {
    return () => {
      slots.forEach((s) => URL.revokeObjectURL(s.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     SUBMIT: validasi -> munculkan modal "Konfirmasi Tambah"
     Proses simpan sebenarnya ada di prosesTambah()
  ======================================================= */

  function handleFormSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (
      !form.tanggal_pelaksanaan ||
      !form.jam_mulai ||
      !form.jam_selesai ||
      !form.id_lokasi ||
      !form.nama_penanggung_jawab.trim() ||
      !form.kontak_penanggung_jawab.trim() ||
      !form.kuota ||
      !form.total_pendaftar_online
    ) {
      setError("Lengkapi semua field wajib");
      return;
    }

    if (form.jam_selesai <= form.jam_mulai) {
      setError("Waktu selesai harus setelah waktu mulai");
      return;
    }

    const kuota = Number(form.kuota);

    if (!Number.isInteger(kuota) || kuota < 0) {
      setError("Kuota pendonor tidak valid");
      return;
    }

    if (slots.length === 0) {
      setError("Foto lokasi wajib dipilih");
      return;
    }

    setShowKonfirmasiTambah(true);
  }

  async function prosesTambah() {
    try {
      setSaving(true);
      setError("");
      setShowKonfirmasiTambah(false);

      const data = new FormData();

      data.append("id_lokasi", form.id_lokasi);
      data.append("tanggal_pelaksanaan", form.tanggal_pelaksanaan);
      data.append("jam_mulai", form.jam_mulai);
      data.append("jam_selesai", form.jam_selesai);
      data.append("nama_penanggung_jawab", form.nama_penanggung_jawab.trim());
      data.append(
        "kontak_penanggung_jawab",
        form.kontak_penanggung_jawab.trim()
      );
      data.append("kuota", form.kuota);
      data.append(
        "total_pendaftar_online",
        form.total_pendaftar_online || "0"
      );
      data.append(
        "total_pendonor_offline",
        form.total_pendonor_offline || "0"
      );
      data.append("pendonor_hadir", form.pendonor_hadir || "0");
      data.append("darah_terkumpul", form.darah_terkumpul || "0");

      // key "foto" diulang per file -> backend baca via getAll("foto")
      slots.forEach((slot) => data.append("foto", slot.file));

      const response = await fetch(
        "/api/web/auth/dashboard/jadwaldonor",
        { method: "POST", credentials: "include", body: data }
      );

      const contentType = response.headers.get("content-type");
      let result: any;

      if (contentType?.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          text || "Server memberikan response yang tidak valid"
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error || result.message || "Gagal menambahkan jadwal"
        );
      }

      console.log("CREATE JADWAL SUCCESS:", result);

      // setelah sukses -> List, bukan View
      router.push("/dashboard/jadwaldonor");
      router.refresh();
    } catch (error) {
      console.error("CREATE JADWAL ERROR:", error);
      setError(error instanceof Error ? error.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      <form id="tambah-jadwal-form" onSubmit={handleFormSubmit}>
        <div className="mb-9 flex items-center justify-between">
          <h1 className="text-[43px] font-bold tracking-tight">
            Tambah Jadwal
          </h1>

          <div className="flex items-center gap-3">
            <BackButton
              onClick={() => setShowKonfirmasiKembali(true)}
            />

            <button
              type="submit"
              disabled={saving}
              className="flex h-[53px] items-center justify-center gap-2 rounded-full bg-red-500 px-8 text-base font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={19} />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-7 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-base text-red-600">
            {error}
          </div>
        )}

        <SectionTitle>Detail Jadwal</SectionTitle>

        <Card>
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-3">
            <Field label="Hari / Tanggal" required>
              <input
                type="date"
                name="tanggal_pelaksanaan"
                value={form.tanggal_pelaksanaan}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Waktu Mulai" required>
              <input
                type="time"
                name="jam_mulai"
                value={form.jam_mulai}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Waktu Selesai" required>
              <input
                type="time"
                name="jam_selesai"
                value={form.jam_selesai}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </Field>

            <Field label="Lokasi" required>
              <select
                name="id_lokasi"
                value={form.id_lokasi}
                onChange={handleChange}
                required
                disabled={loadingLokasi}
                className={inputClass}
              >
                <option value="">
                  {loadingLokasi ? "Mengambil lokasi..." : "Pilih Lokasi"}
                </option>

                {lokasi.map((item) => (
                  <option key={item.id_lokasi} value={item.id_lokasi}>
                    {item.nama_lokasi}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Alamat Lokasi" required>
              <textarea
                value={lokasiTerpilih?.alamat ?? ""}
                placeholder="Alamat otomatis terisi setelah memilih lokasi"
                readOnly
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-100 px-6 py-3.5 text-lg text-black placeholder:text-gray-400 focus:outline-none"
              />
            </Field>
          </div>
        </Card>

        <SectionTitle>Penanggung Jawab</SectionTitle>

        <Card>
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-2">
            <Field label="Nama Penanggung Jawab" required>
              <input
                type="text"
                name="nama_penanggung_jawab"
                value={form.nama_penanggung_jawab}
                onChange={handleChange}
                placeholder="Masukkan nama"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Kontak Penanggung Jawab" required>
              <input
                type="text"
                name="kontak_penanggung_jawab"
                value={form.kontak_penanggung_jawab}
                onChange={handleChange}
                placeholder="Masukkan kontak"
                required
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <SectionTitle>Detail Donor</SectionTitle>

        <Card>
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-3">
            <Field label="Kuota Maksimal" required>
              <input
                type="number"
                min="0"
                name="kuota"
                value={form.kuota}
                onChange={handleChange}
                placeholder="Masukan Kuota Maksimal"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Total Pendaftar (Online)" required>
              <input
                type="number"
                min="0"
                name="total_pendaftar_online"
                value={form.total_pendaftar_online}
                onChange={handleChange}
                placeholder="Masukan Total Pendaftar Online"
                required
                className={inputClass}
              />
            </Field>

            <Field label="Total Pendonor (Offline)">
              <input
                type="number"
                min="0"
                name="total_pendonor_offline"
                value={form.total_pendonor_offline}
                onChange={handleChange}
                placeholder="Masukkan total pendonor offline"
                className={inputClass}
              />
            </Field>

            <Field label="Pendonor Hadir">
              <input
                type="number"
                min="0"
                name="pendonor_hadir"
                value={form.pendonor_hadir}
                onChange={handleChange}
                placeholder="Masukkan pendonor yang hadir"
                className={inputClass}
              />
            </Field>

            <Field label="Darah Terkumpul">
              <input
                type="number"
                min="0"
                name="darah_terkumpul"
                value={form.darah_terkumpul}
                onChange={handleChange}
                placeholder="Masukkan darah terkumpul"
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
            multiple
            onChange={handleTambahFoto}
            className="hidden"
          />

          <label className="mb-2.5 block text-lg font-semibold text-gray-800">
            Foto
          </label>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={slots.length >= MAX_FOTO}
            className="flex h-14 w-full max-w-md items-center rounded-xl border border-gray-200 bg-white text-left text-lg text-gray-400 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex-1 px-5">Pilih Gambar</span>
            <span className="flex h-full items-center rounded-r-xl border-l border-gray-200 bg-gray-100 px-7 text-gray-700">
              Browse
            </span>
          </button>

          {slots.length > 0 && (
            <div className="mt-5">
              <p className="mb-3.5 text-lg font-medium text-gray-800">
                Preview ({slots.length}/{MAX_FOTO})
              </p>

              <div className="flex flex-wrap gap-5">
                {slots.map((slot) => (
                  <div
                    key={slot.key}
                    className="group relative aspect-square w-44 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                  >
                    <img
                      src={slot.url}
                      alt="Foto lokasi"
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute right-2 top-2 flex gap-1.5">
                      <button
                        type="button"
                        title="Lihat foto"
                        onClick={() => setLightboxUrl(slot.url)}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-gray-700 shadow hover:bg-white"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        title="Hapus foto"
                        onClick={() => hapusFoto(slot.key)}
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-red-500 text-white shadow hover:bg-red-600"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mb-5 mt-2.5 text-sm text-gray-400">
            Format JPG/JPEG, maksimal {MAX_FOTO} gambar, masing-masing 5 MB.
          </p>
        </Card>
      </form>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setLightboxUrl(null)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-12 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 hover:bg-white"
            >
              ✕
            </button>

            <img
              src={lightboxUrl}
              alt="Preview foto lokasi"
              className="aspect-square w-full rounded-2xl bg-black object-contain"
            />
          </div>
        </div>
      )}

      <AskModal
        isOpen={showKonfirmasiTambah}
        variant="tanya"
        title="Konfirmasi Tambah"
        description="Apakah anda yakin ingin menambah jadwal donor baru?"
        buttonLabel="Tambah"
        cancelLabel="Batal"
        onClose={() => setShowKonfirmasiTambah(false)}
        onConfirm={prosesTambah}
      />

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
