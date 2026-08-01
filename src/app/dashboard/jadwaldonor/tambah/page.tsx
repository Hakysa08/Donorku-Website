"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Save,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

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

  total_pendonor_offline: "",
  pendonor_hadir: "",
  darah_terkumpul: "",
};

/* =========================================================
   PAGE
========================================================= */

export default function TambahJadwalPage() {
  const router = useRouter();

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  /* =======================================================
     FORM
  ======================================================= */

  const [form, setForm] =
    useState<FormDataJadwal>(INITIAL_FORM);

  /* =======================================================
     LOKASI
  ======================================================= */

  const [lokasi, setLokasi] =
    useState<Lokasi[]>([]);

  const [loadingLokasi, setLoadingLokasi] =
    useState(true);

  /* =======================================================
     STATUS
  ======================================================= */

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =======================================================
     FOTO
  ======================================================= */

  const [foto, setFoto] =
    useState<File | null>(null);

  const [previewFoto, setPreviewFoto] =
    useState<string | null>(null);

  /* =======================================================
     AMBIL DATA LOKASI
  ======================================================= */

  useEffect(() => {
    async function ambilLokasi() {
      try {
        setLoadingLokasi(true);

        const response = await fetch(
          "/api/web/auth/dashboard/daftarlokasi?page=1&limit=50",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Gagal mengambil lokasi"
          );
        }

        setLokasi(result.data ?? []);
      } catch (error) {
        console.error(
          "GET LOKASI ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Gagal mengambil lokasi"
        );
      } finally {
        setLoadingLokasi(false);
      }
    }

    ambilLokasi();
  }, []);

  /* =======================================================
     LOKASI TERPILIH
  ======================================================= */

  const lokasiTerpilih =
    lokasi.find(
      (item) =>
        String(item.id_lokasi) ===
        form.id_lokasi
    );

  /* =======================================================
     INPUT
  ======================================================= */

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>
  ) {
    const { name, value } =
      event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /* =======================================================
     PILIH FOTO
  ======================================================= */

  function handleFoto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    /* JPG / JPEG SAJA */

    if (file.type !== "image/jpeg") {
      setError(
        "Foto harus berformat JPG/JPEG"
      );

      event.target.value = "";

      return;
    }

    /* MAX 5 MB */

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Ukuran foto maksimal 5 MB"
      );

      event.target.value = "";

      return;
    }

    setError("");

    if (previewFoto) {
      URL.revokeObjectURL(
        previewFoto
      );
    }

    const objectUrl =
      URL.createObjectURL(file);

    setFoto(file);
    setPreviewFoto(objectUrl);
  }

  /* =======================================================
     HAPUS FOTO
  ======================================================= */

  function hapusFoto() {
    if (previewFoto) {
      URL.revokeObjectURL(
        previewFoto
      );
    }

    setFoto(null);
    setPreviewFoto(null);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }
  }

  /* =======================================================
     CLEANUP PREVIEW
  ======================================================= */

  useEffect(() => {
    return () => {
      if (previewFoto) {
        URL.revokeObjectURL(
          previewFoto
        );
      }
    };
  }, [previewFoto]);

  /* =======================================================
     SIMPAN
  ======================================================= */

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      /* ===================================================
         VALIDASI FIELD WAJIB
      =================================================== */

      if (
        !form.tanggal_pelaksanaan ||
        !form.jam_mulai ||
        !form.jam_selesai ||
        !form.id_lokasi ||
        !form.nama_penanggung_jawab.trim() ||
        !form.kontak_penanggung_jawab.trim() ||
        !form.kuota
      ) {
        throw new Error(
          "Lengkapi semua field wajib"
        );
      }

      /* ===================================================
         VALIDASI JAM
      =================================================== */

      if (
        form.jam_selesai <=
        form.jam_mulai
      ) {
        throw new Error(
          "Waktu selesai harus setelah waktu mulai"
        );
      }

      /* ===================================================
         VALIDASI KUOTA
      =================================================== */

      const kuota =
        Number(form.kuota);

      if (
        !Number.isInteger(kuota) ||
        kuota < 0
      ) {
        throw new Error(
          "Kuota pendonor tidak valid"
        );
      }

      /* ===================================================
         VALIDASI FOTO
      =================================================== */

      if (!foto) {
        throw new Error(
          "Foto lokasi wajib dipilih"
        );
      }

      /* ===================================================
         BUAT FORMDATA
      =================================================== */

      const data =
        new FormData();

      data.append(
        "id_lokasi",
        form.id_lokasi
      );

      data.append(
        "tanggal_pelaksanaan",
        form.tanggal_pelaksanaan
      );

      data.append(
        "jam_mulai",
        form.jam_mulai
      );

      data.append(
        "jam_selesai",
        form.jam_selesai
      );

      data.append(
        "nama_penanggung_jawab",
        form.nama_penanggung_jawab.trim()
      );

      data.append(
        "kontak_penanggung_jawab",
        form.kontak_penanggung_jawab.trim()
      );

      data.append(
        "kuota",
        form.kuota
      );

      data.append(
        "total_pendonor_offline",
        form.total_pendonor_offline ||
          "0"
      );

      data.append(
        "pendonor_hadir",
        form.pendonor_hadir ||
          "0"
      );

      data.append(
        "darah_terkumpul",
        form.darah_terkumpul ||
          "0"
      );

      /* FOTO */

      data.append(
        "foto",
        foto
      );

      /* ===================================================
         POST

         PENTING:
         Jangan pasang Content-Type manual.

         Browser otomatis membuat:
         multipart/form-data; boundary=...
      =================================================== */

      const response = await fetch(
        "/api/web/auth/dashboard/jadwaldonor",
        {
          method: "POST",

          credentials: "include",

          body: data,
        }
      );

      /* ===================================================
         RESPONSE
      =================================================== */

      const contentType =
        response.headers.get(
          "content-type"
        );

      let result: any;

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        result =
          await response.json();
      } else {
        const text =
          await response.text();

        throw new Error(
          text ||
            "Server memberikan response yang tidak valid"
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            "Gagal menambahkan jadwal"
        );
      }

      console.log(
        "CREATE JADWAL SUCCESS:",
        result
      );

      /* ===================================================
         SUCCESS
      =================================================== */

      router.push(
        "/dashboard/jadwal"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "CREATE JADWAL ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full bg-white px-10 py-7 text-black">
      <form
        id="tambah-jadwal-form"
        onSubmit={handleSubmit}
      >
        {/* ===============================================
            HEADER
        =============================================== */}

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-[36px] font-bold tracking-tight">
              Tambah Jadwal
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Tambahkan jadwal donor baru
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* KEMBALI */}

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              <ArrowLeft size={16} />

              Kembali
            </button>

            {/* SIMPAN */}

            <button
              type="submit"
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-7 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />

              {saving
                ? "Menyimpan..."
                : "Simpan"}
            </button>
          </div>
        </div>

        {/* ===============================================
            ERROR
        =============================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ===============================================
            DETAIL JADWAL
        =============================================== */}

        <SectionTitle>
          Detail Jadwal
        </SectionTitle>

        <Card>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            {/* TANGGAL */}

            <Field
              label="Hari / Tanggal"
              required
            >
              <input
                type="date"
                name="tanggal_pelaksanaan"
                value={
                  form.tanggal_pelaksanaan
                }
                onChange={
                  handleChange
                }
                required
                className={
                  inputClass
                }
              />
            </Field>

            {/* WAKTU MULAI */}

            <Field
              label="Waktu Mulai"
              required
            >
              <input
                type="time"
                name="jam_mulai"
                value={
                  form.jam_mulai
                }
                onChange={
                  handleChange
                }
                required
                className={
                  inputClass
                }
              />
            </Field>

            {/* WAKTU SELESAI */}

            <Field
              label="Waktu Selesai"
              required
            >
              <input
                type="time"
                name="jam_selesai"
                value={
                  form.jam_selesai
                }
                onChange={
                  handleChange
                }
                required
                className={
                  inputClass
                }
              />
            </Field>

            {/* LOKASI */}

            <Field
              label="Lokasi"
              required
            >
              <select
                name="id_lokasi"
                value={
                  form.id_lokasi
                }
                onChange={
                  handleChange
                }
                required
                disabled={
                  loadingLokasi
                }
                className={
                  inputClass
                }
              >
                <option value="">
                  {loadingLokasi
                    ? "Mengambil lokasi..."
                    : "Pilih Lokasi"}
                </option>

                {lokasi.map(
                  (item) => (
                    <option
                      key={
                        item.id_lokasi
                      }
                      value={
                        item.id_lokasi
                      }
                    >
                      {
                        item.nama_lokasi
                      }
                    </option>
                  )
                )}
              </select>
            </Field>

            {/* ALAMAT */}

            <Field label="Alamat Lokasi">
              <textarea
                value={
                  lokasiTerpilih
                    ?.alamat ?? ""
                }
                placeholder="Alamat otomatis mengikuti lokasi"
                readOnly
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-300"
              />
            </Field>
          </div>
        </Card>

        {/* ===============================================
            PENANGGUNG JAWAB
        =============================================== */}

        <SectionTitle>
          Penanggung Jawab
        </SectionTitle>

        <Card>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            {/* NAMA */}

            <Field
              label="Nama Penanggung Jawab"
              required
            >
              <input
                type="text"
                name="nama_penanggung_jawab"
                value={
                  form.nama_penanggung_jawab
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan nama"
                required
                className={
                  inputClass
                }
              />
            </Field>

            {/* KONTAK */}

            <Field
              label="Kontak Penanggung Jawab"
              required
            >
              <input
                type="text"
                name="kontak_penanggung_jawab"
                value={
                  form.kontak_penanggung_jawab
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan kontak"
                required
                className={
                  inputClass
                }
              />
            </Field>
          </div>
        </Card>

        {/* ===============================================
            DETAIL DONOR
        =============================================== */}

        <SectionTitle>
          Detail Donor
        </SectionTitle>

        <Card>
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
            {/* KUOTA */}

            <Field
              label="Kuota Pendonor"
              required
            >
              <input
                type="number"
                min="0"
                name="kuota"
                value={
                  form.kuota
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan kuota"
                required
                className={
                  inputClass
                }
              />
            </Field>

            {/* OFFLINE */}

            <Field label="Total Pendonor (Offline)">
              <input
                type="number"
                min="0"
                name="total_pendonor_offline"
                value={
                  form.total_pendonor_offline
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan total pendonor offline"
                className={
                  inputClass
                }
              />
            </Field>

            {/* HADIR */}

            <Field label="Pendonor Hadir">
              <input
                type="number"
                min="0"
                name="pendonor_hadir"
                value={
                  form.pendonor_hadir
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan pendonor yang hadir"
                className={
                  inputClass
                }
              />
            </Field>

            {/* DARAH */}

            <Field label="Darah Terkumpul">
              <input
                type="number"
                min="0"
                name="darah_terkumpul"
                value={
                  form.darah_terkumpul
                }
                onChange={
                  handleChange
                }
                placeholder="Masukkan darah terkumpul"
                className={
                  inputClass
                }
              />
            </Field>
          </div>
        </Card>

        {/* ===============================================
            FOTO LOKASI
        =============================================== */}

        <SectionTitle>
          Foto Lokasi
        </SectionTitle>

        <Card>
          {/* INPUT FILE ASLI */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,image/jpeg"
            onChange={handleFoto}
            className="hidden"
          />

          <label className="mb-2 block text-sm font-semibold text-gray-800">
            Foto Lokasi
            <span className="text-red-500">
              {" "}*
            </span>
          </label>

          {/* BELUM PILIH FOTO */}

          {!previewFoto ? (
            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
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
              {/* FILE TERPILIH */}

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex h-12 w-full max-w-sm items-center rounded-lg border border-gray-200 bg-white text-left text-sm text-gray-700 transition hover:border-gray-300"
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
                  <img
                    src={previewFoto}
                    alt="Preview lokasi"
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={hapusFoto}
                    title="Hapus foto"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow transition hover:bg-red-600"
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
        </Card>
      </form>
    </div>
  );
}

/* =========================================================
   STYLE
========================================================= */

const inputClass =
  "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-gray-100";

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 mt-8 text-base font-bold text-gray-900">
      {children}
    </h2>
  );
}

/* =========================================================
   CARD
========================================================= */

function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      {children}
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

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

        {required && (
          <span className="text-red-500">
            {" "}*
          </span>
        )}
      </label>

      {children}
    </div>
  );
}