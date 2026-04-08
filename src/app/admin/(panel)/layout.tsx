import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <TopBar userEmail={session.user?.email ?? ""} />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
