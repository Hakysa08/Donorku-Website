import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

type TokenPayload = {
  id_admin: number;
  email: string;
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  let payload: TokenPayload | null = null;

  if (token) {
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch {
      payload = null;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
        <h1 className="mb-2 text-3xl font-extrabold text-black">Berhasil Login</h1>
        {payload ? (
          <p className="text-gray-600">
            Masuk sebagai <span className="font-semibold text-black">{payload.email}</span>
          </p>
        ) : (
          <p className="text-red-600">Token tidak ditemukan/tidak valid</p>
        )}
      </div>
    </div>
  );
}
