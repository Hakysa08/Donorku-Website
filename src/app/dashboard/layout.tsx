import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * Halaman administrator dipakai dalam bentuk website
     * (desktop), jadi lebar minimum dikunci supaya layout
     * tidak pernah berubah bentuk.
     */
    <div className="flex min-h-screen min-w-[1280px] bg-white">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">

        <Topbar />

        <main className="flex-1 px-8 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
