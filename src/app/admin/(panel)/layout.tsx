import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { UnsavedChangesProvider } from "@/components/admin/UnsavedChangesContext";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <UnsavedChangesProvider>
      <AdminShell userEmail={session.user?.email ?? ""}>{children}</AdminShell>
    </UnsavedChangesProvider>
  );
}
