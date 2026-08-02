"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save } from "lucide-react";

import BackButton from "@/components/BackButton";
import AskModal from "@/components/AskModal";

type FormStok = {
  jumlah_kantong: string;
  golongan_darah: string;
  nama_lokasi: string;
  alamat_lokasi: string;
};

const INITIAL_FORM: FormStok = {
  jumlah_kantong: "",
  golongan_darah: "",
  nama_lokasi: "",
  alamat_lokasi: "",
};

const inputClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-5 text-base text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

const textareaClass =
  "min-h-[110px] w-full resize-none rounded-xl border border-gray-200 bg-white px-5 py-3 text-base text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100";

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 mt-9 text-xl font-bold text-gray-900 first:mt-0">
      {children}
    </h2>
  );
}

export default function EditStokDarahPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [form, setForm] = useState<FormStok>(INITIAL_FORM);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // modal state
  const [konfirmasiEdit, setKonfirmasiEdit] = useState(false);
  const [konfirmasiKembali, setKonfirmasiKembali] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSukses, setModalSukses] = useState(false);

  useEffect(() => {
    async function ambilData() {
      try {
        setLoadingData(true);

        const response = await fetch(
          `/api/web/auth/dashboard/stokdarah/${id}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal mengambil detail stok darah");
        }

        const d = result.data;

        setForm({
          jumlah_kantong: String(d.jumlah_kantong ?? ""),
          golongan_darah: d.golongan_darah ?? "",
          nama_lokasi: d.lokasi?.nama_lokasi ?? "-",
          alamat_lokasi: d.lokasi?.alamat ?? "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data");
      } finally {
        setLoadingData(false);
      }
    }

    ambilData();
  }, [id]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!form.jumlah_kantong || !form.alamat_lokasi.trim()) {
      setError("Lengkapi semua field wajib");
      return;
    }

    const jumlahNumber = Number(form.jumlah_kantong);

    if (!Number.isInteger(jumlahNumber) || jumlahNumber < 0) {
      setError("Jumlah stok harus berupa angka bulat dan tidak boleh negatif");
      return;
    }

    // buka modal konfirmasi, submit sebenarnya terjadi di konfirmasiSimpan()
    setKonfirmasiEdit(true);
  }

  async function konfirmasiSimpan() {
    try {
      setSaving(true);

      const response = await fetch(
        `/api/web/auth/dashboard/stokdarah/${id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jumlah_kantong: Number(form.jumlah_kantong),
            alamat_lokasi: form.alamat_lokasi.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal memperbarui stok darah");
      }

      setKonfirmasiEdit(false);
      setModalSukses(true);
    } catch (err) {
      setKonfirmasiEdit(false);
      setModalError(
        err instanceof Error ? err.message : "Gagal memperbarui stok darah"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-full bg-white px-10 py-7">
        <div className="h-6 w-40 animate-pulse rounded bg-gray-100" />
        <div className="mt-6 h-72 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      {/* ================= HEADER ================= */}

      <div className="mb-8 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-[36px] font-bold tracking-tight">
              Edit Stok Darah
            </h1>
            <p className="mt-1 text-base text-gray-500">ID {id}</p>
          </div>
        
          <div className="flex items-center gap-3">
            <BackButton
              onClick={() => setKonfirmasiKembali(true)}
            />
        
            <button
              type="submit"
              form="form-edit-stok"
              className="flex h-10 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-500"
            >
              <Save size={16} />
              Simpan
            </button>
          </div>
        </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ================= FORM ================= */}

      <SectionTitle>Detail Stok</SectionTitle>

      <form
        id="form-edit-stok"
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-7"
      >
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-3">
          <Field label="Jumlah Stok" required>
            <input
              type="number"
              min="0"
              name="jumlah_kantong"
              value={form.jumlah_kantong}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </Field>

          <Field label="Golongan Darah">
            <input
              type="text"
              value={form.golongan_darah}
              disabled
              className={inputClass}
            />
          </Field>

          <Field label="Lokasi">
            <input
              type="text"
              value={form.nama_lokasi}
              disabled
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-6">
          <Field label="Alamat Lokasi" required>
            <textarea
              name="alamat_lokasi"
              value={form.alamat_lokasi}
              onChange={handleChange}
              placeholder="Masukan alamat lokasi"
              required
              className={textareaClass}
            />
          </Field>
        </div>
      </form>

      {/* ================= MODAL KONFIRMASI EDIT ================= */}

      <AskModal
        isOpen={konfirmasiEdit}
        variant="tanya"
        title="Konfirmasi Edit"
        description="Apakah anda yakin ingin mengubah stok darah?"
        buttonLabel={saving ? "Menyimpan..." : "Edit"}
        cancelLabel="Batal"
        onClose={() => {
          if (!saving) setKonfirmasiEdit(false);
        }}
        onConfirm={konfirmasiSimpan}
      />

      {/* ================= MODAL KONFIRMASI KEMBALI ================= */}

      <AskModal
        isOpen={konfirmasiKembali}
        variant="tanya"
        title="Konfirmasi Kembali"
        description="Apakah anda yakin ingin kembali? (Data tidak akan tersimpan)"
        buttonLabel="Kembali"
        cancelLabel="Batal"
        onClose={() => setKonfirmasiKembali(false)}
        onConfirm={() => router.push("/dashboard/stok-darah")}
      />

      {/* ================= MODAL SUKSES ================= */}

      <AskModal
        isOpen={modalSukses}
        variant="success"
        title="Berhasil"
        description="Stok darah berhasil diperbarui."
        buttonLabel="Selesai"
        onClose={() => router.push("/dashboard/stok-darah")}
      />

      {/* ================= MODAL ERROR ================= */}

      <AskModal
        isOpen={modalError !== null}
        variant="warning"
        title="Gagal Menyimpan"
        description={modalError ?? ""}
        buttonLabel="Tutup"
        onClose={() => setModalError(null)}
      />
    </div>
  );
}