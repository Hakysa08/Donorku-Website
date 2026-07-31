"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SuccessModal from "@/components/SuccessModal";
import Image from "next/image";


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/web/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data.message ?? "Gagal mengirim kode OTP");
      setShowError(true);
      return;
    }

    sessionStorage.setItem("reset_email", email);
    router.push("/verify-email");
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
        <h1 className="mb-6 text-4xl font-extrabold text-black">Lupa Password</h1>

        <p className="mb-8 text-lg text-black">
          Masukkan Emailmu untuk mereset password
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <input
            id="email"
            type="email"
            placeholder="Masukan email mu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-gray-700 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
          />

          <button
            type="submit"
            className="w-full rounded-full bg-gradient-to-r from-red-500 to-red-600 py-4 text-lg font-medium text-white shadow-md transition hover:brightness-105"
          >
            Selanjutnya
          </button>
        </form>
      </div>
      <SuccessModal
        isOpen={showError}
        variant="error"
        title="Email Tidak Ditemukan"
        description={errorMessage}
        buttonLabel="Coba Lagi"
        onClose={() => setShowError(false)}
      />
    </div>
  );
}