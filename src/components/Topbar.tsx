"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ChevronDown } from "lucide-react";

import AskModal from "@/components/AskModal";

import { fotoProfilAdmin } from "@/lib/fotoProfil";

/* =========================================================
   TYPE
========================================================= */

type Admin = {
  id_admin: number;
  nama_admin: string;
  email: string;
  foto_profil: string | null;
};

/* =========================================================
   TOPBAR

   Border atas (header) yang dipakai seluruh halaman
   dashboard.

   Isinya foto profil administrator yang sedang login
   beserta dropdown Profile dan Log Out.
========================================================= */

export default function Topbar() {
  const router = useRouter();

  const [admin, setAdmin] =
    useState<Admin | null>(null);

  const [buka, setBuka] =
    useState(false);

  const [konfirmasiLogout, setKonfirmasiLogout] =
    useState(false);

  const wadahRef =
    useRef<HTMLDivElement>(null);

  /* =======================================================
     AMBIL DATA ADMIN
  ======================================================= */

  useEffect(() => {
    async function ambilAdmin() {
      try {
        const response = await fetch(
          "/api/web/auth/dashboard/profile",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        if (!response.ok) {
          return;
        }

        const result =
          await response.json();

        setAdmin(result.data);
      } catch (error) {
        console.error(
          "GET PROFIL ADMIN ERROR:",
          error
        );
      }
    }

    ambilAdmin();
  }, []);

  /* =======================================================
     TUTUP DROPDOWN

     Dropdown tertutup ketika:
     - klik di luar area topbar
     - menekan tombol Escape
  ======================================================= */

  useEffect(() => {
    if (!buka) {
      return;
    }

    function klikDiLuar(
      event: MouseEvent
    ) {
      if (
        wadahRef.current &&
        !wadahRef.current.contains(
          event.target as Node
        )
      ) {
        setBuka(false);
      }
    }

    function tekanEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setBuka(false);
      }
    }

    document.addEventListener(
      "mousedown",
      klikDiLuar
    );

    document.addEventListener(
      "keydown",
      tekanEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        klikDiLuar
      );

      document.removeEventListener(
        "keydown",
        tekanEscape
      );
    };
  }, [buka]);

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function keluar() {
    try {
      await fetch(
        "/api/web/auth/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );
    } finally {
      setKonfirmasiLogout(false);

      router.push("/login");

      router.refresh();
    }
  }

  /* =======================================================
     DATA TAMPILAN
  ======================================================= */

  const namaDepan =
    admin?.nama_admin
      ?.trim()
      .split(" ")[0] || "Admin";

  const foto = fotoProfilAdmin(
    admin?.foto_profil
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <header className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center justify-end border-b border-black bg-white px-8">

        <div
          ref={wadahRef}
          className="relative"
        >
          {/* ===============================================
              TOMBOL PROFIL
          =============================================== */}

          <button
            type="button"
            onClick={() =>
              setBuka(
                (sebelumnya) =>
                  !sebelumnya
              )
            }
            aria-haspopup="menu"
            aria-expanded={buka}
            className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors duration-200 hover:bg-gray-50"
          >
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
              <Image
                src={foto}
                alt={namaDepan}
                fill
                sizes="32px"
                className="object-cover"
              />
            </span>

            <span className="text-sm text-black">
              Hi, {namaDepan}
            </span>

            <ChevronDown
              className={`h-4 w-4 text-black transition-transform duration-200 ${
                buka ? "rotate-180" : ""
              }`}
              strokeWidth={3}
            />
          </button>

          {/* ===============================================
              DROPDOWN
          =============================================== */}

          <div
            className={`absolute right-0 top-full z-50 mt-2 w-[190px] origin-top-right overflow-hidden rounded-lg border border-black bg-white transition-all duration-200 ${
              buka
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-1 scale-95 opacity-0"
            }`}
            role="menu"
          >
            {/* PROFILE */}

            <Link
              href="/dashboard/profile"
              role="menuitem"
              onClick={() =>
                setBuka(false)
              }
              className="flex items-center gap-2.5 border-b border-black px-3 py-2.5 text-sm text-black transition-colors duration-200 hover:bg-gray-50"
            >
              <Image
                src="/button/profile.png"
                alt="Profile"
                width={18}
                height={18}
                className="object-contain"
              />

              <span>Profile</span>
            </Link>

            {/* LOG OUT */}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setBuka(false);

                setKonfirmasiLogout(
                  true
                );
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-[#EC2727] transition-colors duration-200 hover:bg-red-50"
            >
              <Image
                src="/button/logout.png"
                alt="Log Out"
                width={18}
                height={18}
                className="object-contain"
              />

              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          KONFIRMASI LOGOUT
      ===================================================== */}

      <AskModal
        isOpen={konfirmasiLogout}
        variant="tanya"
        title="Konfirmasi Log Out"
        description="Apakah anda yakin ingin keluar dari akun ini?"
        buttonLabel="Log Out"
        cancelLabel="Batal"
        onConfirm={keluar}
        onClose={() =>
          setKonfirmasiLogout(false)
        }
      />
    </>
  );
}
