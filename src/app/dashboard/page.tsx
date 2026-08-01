import { redirect } from "next/navigation";

/* =========================================================
   DASHBOARD

   Halaman /dashboard tidak menampilkan apa pun.

   Administrator yang baru login langsung diarahkan
   ke halaman Beranda.
========================================================= */

export default function DashboardPage() {
  redirect("/dashboard/beranda");
}
