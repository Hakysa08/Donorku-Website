"use client";

import {
  useEffect,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import { fotoProfilAdmin } from "@/lib/fotoProfil";

/* =========================================================
   TYPE
========================================================= */

type Admin = {
  id_admin: number;
  nama_admin: string;
  email: string;
  no_hp: string | null;
  alamat: string | null;
  foto_profil: string | null;
};

/* =========================================================
   BARIS DATA
========================================================= */

function BarisProfil({
  label,
  nilai,
  garisBawah,
}: {
  label: string;
  nilai: string;
  garisBawah?: boolean;
}) {
  return (
    <div className="mb-7 last:mb-0">
      <p className="text-xl font-bold text-black">
        {label}
      </p>

      <p
        className={`mt-2 text-lg text-black ${
          garisBawah ? "underline" : ""
        }`}
      >
        {nilai}
      </p>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProfilePage() {
  const [admin, setAdmin] =
    useState<Admin | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =======================================================
     AMBIL PROFIL
  ======================================================= */

  useEffect(() => {
    async function ambilProfil() {
      try {
        const response = await fetch(
          "/api/web/auth/dashboard/profile",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Gagal mengambil profil"
          );
        }

        setAdmin(result.data);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan"
        );
      } finally {
        setLoading(false);
      }
    }

    ambilProfil();
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />

          <p className="mt-3 text-sm text-gray-400">
            Memuat Profil...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !admin) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="rounded-xl border border-red-100 bg-red-50 px-6 py-5 text-center">
          <p className="font-semibold text-red-500">
            Profil gagal dimuat
          </p>

          <p className="mt-1 text-xs text-red-400">
            {error ||
              "Data administrator tidak ditemukan"}
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="w-full px-6 pb-10 pt-7">

      {/* ===================================================
          HEADER
      =================================================== */}

      <h1 className="text-[32px] font-bold leading-tight tracking-tight text-black">
        Profile Administrator
      </h1>

      {/* ===================================================
          FOTO DAN NAMA
      =================================================== */}

      <div className="mt-6 flex items-start gap-8">
        <span className="relative h-[190px] w-[190px] shrink-0 overflow-hidden bg-gray-100 shadow-md">
          <Image
            src={fotoProfilAdmin(
              admin.foto_profil
            )}
            alt={admin.nama_admin}
            fill
            sizes="190px"
            className="object-cover"
          />
        </span>

        <p className="mt-8 text-2xl font-bold text-black">
          {admin.nama_admin}
        </p>
      </div>

      {/* ===================================================
          DATA PROFIL
      =================================================== */}

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

        <BarisProfil
          label="Nama Lengkap"
          nilai={admin.nama_admin}
        />

        <BarisProfil
          label="Email"
          nilai={admin.email}
          garisBawah
        />

        <BarisProfil
          label="No. Telepon"
          nilai={admin.no_hp || "-"}
        />

        <BarisProfil
          label="Alamat"
          nilai={admin.alamat || "-"}
        />

        {/* =================================================
            TOMBOL
        ================================================= */}

        <div className="mt-10 flex justify-end gap-4">

          <Link
            href="/dashboard/profile/password"
            className="flex h-12 w-[200px] items-center justify-center rounded-lg bg-[#EC2727] text-base font-bold text-white shadow-sm transition-colors duration-200 hover:bg-[#d31f1f]"
          >
            Edit Password
          </Link>

          <Link
            href="/dashboard/profile/edit"
            className="flex h-12 w-[200px] items-center justify-center rounded-lg border border-[#EC2727] bg-white text-base font-bold text-[#EC2727] shadow-sm transition-colors duration-200 hover:bg-red-50"
          >
            Edit Profil
          </Link>
        </div>
      </section>
    </div>
  );
}
