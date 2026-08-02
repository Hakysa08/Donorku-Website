"use client";

import { ArrowLeft } from "lucide-react";

/* =========================================================
   BACK BUTTON

   Tombol "Kembali" yang dipakai konsisten di seluruh fitur.
   Cukup kirim handler onClick (navigasi / buka modal konfirmasi).
========================================================= */

export default function BackButton({
  onClick,
  label = "Kembali",
  className = "",
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 ${className}`}
    >
      <ArrowLeft size={18} strokeWidth={2.5} />
      {label}
    </button>
  );
}
