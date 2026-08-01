"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import SuccessModal from "@/components/SuccessModal";
import Image from "next/image";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Password dan konfirmasi password tidak sama");
      setShowError(true);
      return;
    }

    const email = sessionStorage.getItem("reset_email");
    const otp = sessionStorage.getItem("reset_otp");

    if (!email || !otp) {
      router.push("/forgot-password");
      return;
    }

    const res = await fetch("/api/web/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp, password_baru: password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data.message ?? "Gagal mereset password");
      setShowError(true);
      return;
    }

    sessionStorage.removeItem("reset_email");
    sessionStorage.removeItem("reset_otp");
    setShowSuccess(true);
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
        <h1 className="mb-10 text-4xl font-extrabold text-black">Atur Password Baru</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="password" className="mb-1 block text-lg text-black">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukan Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-5 py-4 pr-12 text-gray-700 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-lg text-black">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Masukan Kembali Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 px-5 py-4 pr-12 text-gray-700 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-full bg-gradient-to-r from-red-500 to-red-600 py-4 text-lg font-medium text-white shadow-md transition hover:brightness-105"
          >
            Atur Ulang Password
          </button>
        </form>
      </div>
      <SuccessModal
        isOpen={showError}
        variant="error"
        title="Password Salah"
        description={errorMessage}
        buttonLabel="Coba Lagi"
        onClose={() => setShowError(false)}
      />
      <SuccessModal
        isOpen={showSuccess}
        variant="success"
        title="Password Berhasil Diganti"
        description="Anda telah berhasil mengganti password baru. Silahkan coba login kembali"
        buttonLabel="Kembali"
        onClose={() => router.push("/login")}
      />
    </div>
  );
}
