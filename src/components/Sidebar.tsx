"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  {
    label: "Beranda",
    href: "/dashboard/beranda",
    icon: "/sidebar/beranda.png",
    activeIcon: "/sidebar/beranda_red.png",
  },
  {
    label: "Daftar Lokasi",
    href: "/dashboard/daftarlokasi",
    icon: "/sidebar/lokasi_donor.png",
    activeIcon: "/sidebar/lokasi_donor_red.png",
  },
  {
    label: "Jadwal Donor",
    href: "/dashboard/jadwaldonor",
    icon: "/sidebar/jadwal_donor.png",
    activeIcon: "/sidebar/jadwal_donor_red.png",
  },
  {
    label: "Daftar Pendonor",
    href: "/dashboard/pendonor",
    icon: "/sidebar/daftar_pendonor.png",
    activeIcon: "/sidebar/daftar_pendonor_red.png",
  },
  {
    label: "Stok Darah",
    href: "/dashboard/stok-darah",
    icon: "/sidebar/stok_darah.png",
    activeIcon: "/sidebar/stok_darah_red.png",
  },
  {
    label: "Aturan dan tips",
    href: "/dashboard/aturantips",
    icon: "/sidebar/aturan_tips.png",
    activeIcon: "/sidebar/aturan_tips_red.png",
  },
  {
    label: "Riwayat Donor",
    href: "/dashboard/riwayat",
    icon: "/sidebar/riwayat_pendonor.png",
    activeIcon: "/sidebar/riwayat_pendonor_red.png",
  },
];

const LOGO_SRC = "/logo/logo.png";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    /*
     * Sidebar mengikuti design Figma:
     *
     * - background #FCFCFC
     * - garis pembatas kanan hitam
     * - menempel (sticky) saat konten di-scroll
     */
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-black bg-[#FCFCFC] px-4 py-6">

      {/* Logo Donorku */}
      <Link
        href="/dashboard/beranda"
        className="mb-8 flex items-center gap-2 px-2"
      >
        <span className="relative h-9 w-9 shrink-0">
          <Image
            src={LOGO_SRC}
            alt="Donorku"
            fill
            className="object-contain"
          />
        </span>

        <span className="text-xl font-bold text-gray-900">
          Donorku
        </span>
      </Link>

      {/* Menu */}
      <nav className="flex flex-1 flex-col gap-1">
        {MENU_ITEMS.map(
          ({
            label,
            href,
            icon,
            activeIcon,
          }) => {
            /*
             * Beranda hanya aktif tepat di /dashboard.
             *
             * Menu lainnya boleh aktif juga pada child route.
             * Contoh:
             * /dashboard/lokasi/123
             * tetap mengaktifkan Daftar Lokasi.
             */
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === href ||
                  pathname.startsWith(
                    `${href}/`
                  );

            return (
              /*
               * Di Figma menu aktif TIDAK memakai background pill.
               *
               * Yang berubah hanya warna teks dan ikon
               * menjadi merah.
               */
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-[#EC2727]"
                    : "text-[#1A1A1A] hover:text-[#EC2727]"
                }`}
              >
                {/* Icon */}
                <span className="relative h-[18px] w-[18px] shrink-0">
                  <Image
                    src={
                      isActive
                        ? activeIcon ?? icon
                        : icon
                    }
                    alt={label}
                    fill
                    className="object-contain transition-transform duration-200 group-hover:scale-110"
                  />
                </span>

                {/* Label */}
                <span>{label}</span>
              </Link>
            );
          }
        )}
      </nav>
    </aside>
  );
}
