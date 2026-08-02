// LABEL FILE: app/dashboard/jadwaldonor/[id]/edit/page.tsx

"use client";

import DatePickerInput from "@/components/DatePickerInput";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, Save, Trash2 } from "lucide-react";

// SESUAIKAN PATH INI kalau lokasi komponennya beda
import AskModal from "@/components/AskModal";
import BackButton from "@/components/BackButton";

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
  total_pendaftar_online: "",
  total_pendonor_offline: "",
  pendonor_hadir: "",
  darah_terkumpul: "",
  status_jadwal: "aktif",
};

const inputClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-5 text-base text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100";

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
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
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

function toHHMM(value: string | null) {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

type Slot = {
  key: string;
  url: string; // objectURL (baru) atau path server (lama)
  file?: File; // ada isinya kalau ini foto baru
  isLama: boolean;
};

const MAX_FOTO = 5;

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

  const [slots, setSlots] = useState<Slot[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [showKonfirmasiEdit, setShowKonfirmasiEdit] = useState(false);
  const [showKonfirmasiKembali, setShowKonfirmasiKembali] = useState(false);

  const lokasiTerpilih = lokasi.find(
    (item) => String(item.id_lokasi) === form.id_lokasi
  );

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
          throw new Error(
            detailResult.message || "Gagal mengambil detail jadwal"
          );
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
          total_pendaftar_online: String(d.total_pendaftar_online ?? ""),
          total_pendonor_offline: String(d.total_pendonor_offline ?? ""),
          pendonor_hadir: String(d.pendonor_hadir ?? ""),
          darah_terkumpul: String(d.darah_terkumpul ?? ""),
          status_jadwal: d.status_jadwal ?? "aktif",
        });

        const fotoArray: string[] = Array.isArray(d.foto_lokasi)
          ? d.foto_lokasi
          : [];

        setSlots(
          fotoArray.map((url, i) => ({
            key: `lama-${i}-${url}`,
            url,
            isLama: true,
          }))
        );
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
      key: `baru-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
      isLama: false,
    }));

    setSlots((prev) => [...prev, ...slotBaru]);
    event.target.value = "";
  }

  function hapusFoto(key: string) {
    setSlots((prev) => {
      const target = prev.find((s) => s.key === key);
      if (target && !target.isLama) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((s) => s.key !== key);
    });
  }

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

    const tanggalSudahLewat = form.tanggal_pelaksanaan < todayStr();

    if (!tanggalSudahLewat && form.jam_selesai <= form.jam_mulai) {
      setError("Waktu selesai harus setelah waktu mulai");
      return;
    }

    if (slots.length === 0) {
      setError("Foto lokasi wajib ada minimal 1");
      return;
    }

    setShowKonfirmasiEdit(true);
  }

  async function prosesEdit() {
    try {
      setSaving(true);
      setError("");
      setShowKonfirmasiEdit(false);

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
      data.append("kuota", form.kuota || "0");
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
      data.append("status_jadwal", form.status_jadwal);

      const fotoLama = slots.filter((s) => s.isLama).map((s) => s.url);
      data.append("foto_lama", JSON.stringify(fotoLama));

      slots
        .filter((s) => !s.isLama && s.file)
        .forEach((s) => data.append("foto", s.file as File));

      const response = await fetch(
        `/api/web/auth/dashboard/jadwaldonor/${id}`,
        { method: "PUT", credentials: "include", body: data }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui jadwal");
      }

      router.push("/dashboard/jadwaldonor");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui jadwal");
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-100" />
        <div className="mt-7 h-96 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      <div className="mb-8 flex items-start justify-between">
        <h1 className="text-[36px] font-bold tracking-tight">
          Edit Jadwal ID {id}
        </h1>

        <div className="flex items-center gap-3">
          <BackButton
            onClick={() => setShowKonfirmasiKembali(true)}
          />

          <button
            type="submit"
            form="form-edit-jadwal"
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
          >
            <Save size={16} /> {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <form id="form-edit-jadwal" onSubmit={handleFormSubmit} className="pb-10">
        <SectionTitle>Detail Jadwal</SectionTitle>
        <Card>
          <div className="grid grid-cols-1 gap-x-10 gap-y-7 md:grid-cols-3">
            <Field label="Hari / Tanggal" required>
              <DatePickerInput
                value={form.tanggal_pelaksanaan}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, tanggal_pelaksanaan: value }))
                }
                required
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
                className={inputClass}
              >
                <option value="">Masukan Lokasi</option>
                {lokasi.map((item) => (
                  <option key={item.id_lokasi} value={item.id_lokasi}>
                    {item.nama_lokasi}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Alamat Lokasi" required>
              <textarea
                readOnly
                placeholder="Alamat otomatis terisi setelah memilih lokasi"
                rows={3}
                value={lokasiTerpilih?.alamat ?? ""}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-100 px-5 py-3 text-base text-black placeholder:text-gray-400 focus:outline-none"
              />
            </Field>

            {/*
              Field "Status Jadwal" sengaja disembunyikan dari UI (sesuai
              prototipe), tapi value-nya tetap disimpan di state form dan
              tetap dikirim ke server, jadi status yang sudah ada di
              database TIDAK berubah/ter-reset.
            */}
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
                placeholder="Masukan Nama"
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
                placeholder="Masukan Kontak"
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
                placeholder="Masukan Total Pendonor Offline"
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
                placeholder="Masukan Pendonor yang hadir"
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
                placeholder="Masukan Darah Terkumpul"
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

          <Field label="Foto" required>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={slots.length >= MAX_FOTO}
              className="flex h-12 w-full max-w-md items-center rounded-xl border border-gray-200 bg-white text-left text-base text-gray-400 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex-1 px-5">Pilih Gambar</span>
              <span className="flex h-full items-center rounded-r-xl border-l border-gray-200 bg-gray-100 px-6 text-sm text-gray-700">
                Browse
              </span>
            </button>
          </Field>

          {slots.length > 0 && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-medium text-gray-700">
                Preview ({slots.length}/{MAX_FOTO})
              </p>

              <div className="flex flex-wrap gap-5">
                {slots.map((slot) => (
                  <div
                    key={slot.key}
                    className="group relative aspect-square w-44 overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-white/90 text-gray-700 shadow hover:bg-white"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        type="button"
                        title="Hapus foto"
                        onClick={() => hapusFoto(slot.key)}
                        className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600 text-white shadow hover:bg-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="mb-5 mt-3 text-sm text-gray-400">
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
        isOpen={showKonfirmasiEdit}
        variant="tanya"
        title="Konfirmasi Edit"
        description="Apakah anda yakin ingin mengubah jadwal donor?"
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