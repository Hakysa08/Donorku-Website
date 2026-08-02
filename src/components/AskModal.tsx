"use client";

import Image from "next/image";

type AskModalProps = {
  isOpen: boolean;
  variant?: "warning" | "tanya" | "error" | "success";
  title: string;
  description: string;
  buttonLabel?: string;
  cancelLabel?: string;
  image?: string;
  onClose: () => void;
  onConfirm?: () => void;
};

const defaultImage: Record<string, string> = {
  warning: "/popup-card/warning.png",
  tanya: "/popup-card/tanya.png",
  error: "/popup-card/warning.png",
  success: "/popup-card/benar.png",
};

export default function AskModal({
  isOpen,
  variant = "warning",
  title,
  description,
  buttonLabel,
  cancelLabel,
  image,
  onClose,
  onConfirm,
}: AskModalProps) {
  if (!isOpen) return null;

  const defaultLabel = variant === "warning" ? "Delete" : "Kembali";
  const imageSrc = image ?? defaultImage[variant];
  const isKonfirmasi = typeof onConfirm === "function";

  return (
    <div className="animasi-fade fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="animasi-scale relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl">
        {variant === "error" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 text-black hover:text-gray-600"
          >
            <Image
              src="/button/close.png"
              alt="keluar"
              width={16}
              height={16}
            />
          </button>
        )}

        <div className="mb-6 flex justify-center">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={title}
              className="object-contain"
              width={100}
              height={100}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-100">
              <div className="h-8 w-8 rounded bg-gray-400" />
            </div>
          )}
        </div>

        <h2 className="mb-3 text-2xl font-extrabold text-black">{title}</h2>
        <p className="mb-8 text-base text-gray-600">{description}</p>

        {isKonfirmasi ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 rounded-full bg-red-600 py-3 font-semibold text-white transition hover:brightness-105"
            >
              {buttonLabel ?? defaultLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {cancelLabel ?? "Batal"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-red-600 py-3 font-semibold text-white transition hover:brightness-105"
          >
            {buttonLabel ?? defaultLabel}
          </button>
        )}
      </div>
    </div>
  );
}
