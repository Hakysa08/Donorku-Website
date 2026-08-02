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
    extraActivePaths: ["/dashboard/profile"],
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
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r-2 border-black bg-white px-5 py-7">

      {/* Logo Donorku */}
      <Link
        href="/dashboard"
        className="mb-9 flex items-center gap-2.5 px-2"
      >
        <span className="relative h-11 w-11 shrink-0">
          <Image
            src={LOGO_SRC}
            alt="Donorku"
            fill
            className="object-contain"
          />
        </span>

        <span className="text-2xl text-gray-900">
          Donorku
        </span>
      </Link>

      {/* Menu */}
      <nav className="flex flex-1 flex-col gap-1.5">
        {MENU_ITEMS.map(
          ({ label, href, icon, activeIcon, extraActivePaths }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === href ||
                  pathname.startsWith(`${href}/`) ||
                  (extraActivePaths ?? []).some(
                    (p) => pathname === p || pathname.startsWith(`${p}/`)
                  );
        
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3.5 rounded-lg px-3.5 py-3 text-base font-medium transition-colors ${
                  isActive
                    ? "text-red-600"
                    : "text-black hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                {/* Icon */}
                <span className="relative h-[22px] w-[22px] shrink-0">
                  <Image
                    src={
                      isActive
                        ? activeIcon ?? icon
                        : icon
                    }
                    alt={label}
                    fill
                    className="object-contain"
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
