"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SuccessModal from "@/components/SuccessModal";
import Image from "next/image";

const CODE_LENGTH = 6;

export default function VerifyEmailPage() {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showResendSuccess, setShowResendSuccess] = useState(false);

  const [email, setEmail] = useState("");

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("reset_email");
    if (!savedEmail) {
      router.push("/forgot-password");
      return;
    }
    setEmail(savedEmail);
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join("");

    const res = await fetch("/api/web/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp: fullCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data.message ?? "Kode verifikasi salah");
      setShowError(true);
      return;
    }

    sessionStorage.setItem("reset_otp", fullCode);
    router.push("/reset-password");
  };

  const handleResend = async () => {
    try {
      const res = await fetch("/api/web/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.message ?? "Gagal mengirim ulang kode");
        setShowError(true);
        return;
      }

      setShowResendSuccess(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Terjadi kesalahan saat mengirim ulang kode");
      setShowError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-stretch border-2 border-black bg-white">
      {}
      <div className="relative hidden w-4/5 items-center justify-center border-r-2 border-black md:flex">
        <div className="flex flex-col items-center gap-2">
          <Image src="/logo/logo_bt_type.png" alt="logo type bottom" width={120} height={120}/>
        </div>
      </div>

      {}
      <div className="flex w-full flex-col justify-start px-10 pt-32 pb-16 md:w-1/2 md:px-24">
        <h1 className="mb-4 text-4xl font-extrabold text-black">Verifikasi Email</h1>

        <p className="mb-8 text-base text-gray-500">
          Kami telah mengirim email kepada admin {email}
          <br />
          Masukan kode yang ada di email
        </p>

        <div className="mb-8 flex gap-3">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-16 w-16 rounded-xl border border-gray-300 text-center text-xl text-black focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          className="mb-6 w-full rounded-full bg-gradient-to-r from-red-500 to-red-600 py-4 text-lg font-medium text-white shadow-md transition hover:brightness-105"
        >
          Verifikasi
        </button>

        <p className="text-base text-black">
          Belum mendapatkan kode?{" "}
          <button
            type="button"
            onClick={handleResend}
            className="text-blue-600 underline hover:text-blue-700"
          >
            Kirim ulang
          </button>
        </p>
      </div>
      <SuccessModal
        isOpen={showResendSuccess}
        variant="success"
        title="Kode Terkirim"
        description="Kode baru telah dikirim ke email kamu"
        buttonLabel="Oke"
        onClose={() => setShowResendSuccess(false)}
      />
      <SuccessModal
        isOpen={showError}
        variant="error"
        title="Kode Verifikasi Salah"
        description={errorMessage || "Kode yang Anda masukan salah atau sudah kedaluwarsa"}
        buttonLabel="Coba Lagi"
        onClose={() => setShowError(false)}
      />
    </div>
  );
}