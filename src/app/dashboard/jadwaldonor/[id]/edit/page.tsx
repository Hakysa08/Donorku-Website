"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";

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
  total_pendonor_offline: string;
  pendonor_hadir: string;
  darah_terkumpul: string;
  status_jadwal: string;
};

const INITIAL_FORM: FormDataJadwal = {
  tanggal_pelaksanaan: "",
  jam_mulai: "",
  jam_selesai: "",
  id_lokasi: "",
  nama_penanggung_jawab: "",
  kontak_penanggung_jawab: "",
  kuota: "",
  total_pendonor_offline: "",
  pendonor_hadir: "",
  darah_terkumpul: "",
  status_jadwal: "aktif",
};

const inputClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100";

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
      <label className="mb-2 block text-sm font-semibold text-gray-800">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 mt-8 text-base font-bold text-gray-900">{children}</h2>;
}

// Konversi "1970-01-01T14:00:00.000Z" atau "14:00" jadi "14:00"
function toHHMM(value: string | null) {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

export default function EditJadwalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormDataJadwal>(INITIAL_FORM);
  const [lokasi, setLokasi] = useState<Lokasi[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fotoLama, setFotoLama] = useState<string | null>(null);
  const [fotoBaru, setFotoBaru] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  useEffect(() => {
    async function ambilData() {
      try {
        setLoadingData(true);

        const [lokasiRes, detailRes] = await Promise.all([
          fetch("/api/web/auth/dashboard/daftarlokasi?page=1&limit=50", {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`/api/web/auth/dashboard/jadwaldonor/${id}`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const lokasiResult = await lokasiRes.json();
        const detailResult = await detailRes.json();

        if (!lokasiRes.ok) {
          throw new Error(lokasiResult.message || "Gagal mengambil lokasi");
        }
        if (!detailRes.ok) {
          throw new Error(detailResult.message || "Gagal mengambil detail jadwal");
        }

        setLokasi(lokasiResult.data ?? []);

        const d = detailResult.data;

        setForm({
          tanggal_pelaksanaan: d.tanggal_pelaksanaan
            ? String(d.tanggal_pelaksanaan).slice(0, 10)
            : "",
          jam_mulai: toHHMM(d.jam_mulai),
          jam_selesai: toHHMM(d.jam_selesai),
          id_lokasi: String(d.id_lokasi),
          nama_penanggung_jawab: d.nama_penanggung_jawab ?? "",
          kontak_penanggung_jawab: d.kontak_penanggung_jawab ?? "",
          kuota: String(d.kuota ?? ""),
          total_pendonor_offline: String(d.total_pendonor_offline ?? ""),
          pendonor_hadir: String(d.pendonor_hadir ?? ""),
          darah_terkumpul: String(d.darah_terkumpul ?? ""),
          status_jadwal: d.status_jadwal ?? "aktif",
        });

        setFotoLama(d.foto_lokasi ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        setLoadingData(false);
      }
    }

    ambilData();
  }, [id]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleFoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/jpeg") {
      setError("Foto harus berformat JPG/JPEG");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto maksimal 5 MB");
      event.target.value = "";
      return;
    }

    setError("");

    if (previewFoto) URL.revokeObjectURL(previewFoto);

    setFotoBaru(file);
    setPreviewFoto(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (
        !form.tanggal_pelaksanaan ||
        !form.jam_mulai ||
        !form.jam_selesai ||
        !form.id_lokasi ||
        !form.nama_penanggung_jawab.trim() ||
        !form.kontak_penanggung_jawab.trim() ||
        !form.kuota
      ) {
        throw new Error("Lengkapi semua field wajib");
      }

      if (form.jam_selesai <= form.jam_mulai) {
        throw new Error("Waktu selesai harus setelah waktu mulai");
      }

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
      data.append("total_pendonor_offline", form.total_pendonor_offline || "0");
      data.append("pendonor_hadir", form.pendonor_hadir || "0");
      data.append("darah_terkumpul", form.darah_terkumpul || "0");
      data.append("status_jadwal", form.status_jadwal);

      if (fotoBaru) {
        data.append("foto", fotoBaru);
      }

      const response = await fetch(
        `/api/web/auth/dashboard/jadwaldonor/${id}`,
        {
          method: "PUT",
          credentials: "include",
          body: data,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui jadwal");
      }

      router.push(`/dashboard/jadwaldonor/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui jadwal");
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      <button
        onClick={() => router.push(`/dashboard/jadwaldonor/${id}`)}
        className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft size={16} /> Kembali
      </button>

      <h1 className="mb-6 text-[28px] font-bold">Edit Jadwal Donor</h1>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 pb-10">
        <SectionTitle>Jadwal & Lokasi</SectionTitle>
        <Card>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Tanggal Pelaksanaan" required>
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

            <Field label="Lokasi Donor" required>
              <select
                name="id_lokasi"
                value={form.id_lokasi}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="">Pilih lokasi</option>
                {lokasi.map((item) => (
                  <option key={item.id_lokasi} value={item.id_lokasi}>
                    {item.nama_lokasi}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status Jadwal" required>
              <select
                name="status_jadwal"
                value={form.status_jadwal}
                onChange={handleChange}
                required
                className={inputClass}
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
                <option value="selesai">Selesai</option>
              </select>
            </Field>
          </div>
        </Card>

        <SectionTitle>Penanggung Jawab</SectionTitle>
        <Card>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Nama Penanggung Jawab" required>
              <input
                type="text"
                name="nama_penanggung_jawab"
                value={form.nama_penanggung_jawab}
                onChange={handleChange}
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
                required
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <SectionTitle>Detail Donor</SectionTitle>
        <Card>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Kuota Pendonor" required>
              <input
                type="number"
                min="0"
                name="kuota"
                value={form.kuota}
                onChange={handleChange}
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
            onChange={handleFoto}
            className="hidden"
          />

          {previewFoto ? (
            <div className="relative h-44 w-64 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewFoto}
                alt="Preview lokasi"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  if (previewFoto) URL.revokeObjectURL(previewFoto);
                  setFotoBaru(null);
                  setPreviewFoto(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow hover:bg-red-600"
              >
                <img src="/button/delete.png" alt="Hapus" className="h-3 w-3" />
              </button>
            </div>
          ) : fotoLama ? (
            <div className="relative h-44 w-64 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fotoLama}
                alt="Foto lokasi saat ini"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-44 w-64 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400">
              Belum ada foto
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 h-11 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ganti Foto
          </button>

          <p className="mt-2 text-xs text-gray-400">
            Format JPG/JPEG, maksimal 5 MB. Kosongkan kalau tidak ingin ganti foto.
          </p>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/jadwaldonor/${id}`)}
            className="h-12 rounded-xl border border-gray-200 px-6 text-sm font-medium hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex h-12 items-center gap-2 rounded-xl bg-[#ff2938] px-6 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            <img src="/button/save.png" alt="Save" className="h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
