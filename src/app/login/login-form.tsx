"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import SuccessModal from "@/components/SuccessModal";
import Image from "next/image";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setErrorMessage(
        error === "google_gagal" || error === "facebook_gagal"
          ? "Gagal login, silakan coba lagi"
          : error
      );
      setShowError(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/web/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMessage(data.message ?? "Email atau password salah");
      setShowError(true);
      return;
    }

    router.push("/dashboard/beranda");
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
        <h1 className="mb-10 text-4xl font-extrabold text-black">Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-lg text-black">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="Masukan email mu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-5 py-4 text-gray-700 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-lg text-black">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="Masukan password mu"
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

          <a
            href="/forgot-password"
            className="w-fit text-sm text-black hover:underline"
          >
            Lupa password?
          </a>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-gradient-to-r from-red-500 to-red-600 py-4 text-lg font-medium text-white shadow-md transition hover:brightness-105"
          >
            Masuk
          </button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-gray-300" />
          <span className="text-sm text-gray-400">Atau</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        <div className="flex flex-col gap-4">
          <a
            href="/api/web/auth/google"
            className="flex items-center justify-center gap-3 rounded-full border border-gray-200 py-3.5 shadow-sm hover:bg-gray-50"
          >
            <Image src="/acc-login/google.png" alt="icon google" width={22} height={22}/>
            <span className="text-base text-black">Masuk dengan Google</span>
          </a>

          <a
            href="/api/web/auth/facebook"
            className="flex items-center justify-center gap-3 rounded-full border border-gray-200 py-3.5 shadow-sm hover:bg-gray-50"
          >
            <Image src="/acc-login/facebook.png" alt="icon facebook" width={22} height={22}/>
            <span className="text-base text-black">Masuk dengan Facebook</span>
          </a>
        </div>
      </div>
      <SuccessModal
        isOpen={showError}
        variant="error"
        title="Login Gagal"
        description={errorMessage}
        buttonLabel="Coba Lagi"
        onClose={() => setShowError(false)}
      />
    </div>
  );
}
