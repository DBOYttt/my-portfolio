import { signOut } from "@/auth";

interface TopBarProps {
  userEmail: string;
}

export default function TopBar({ userEmail }: TopBarProps) {
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/admin/login" });
  }

  return (
    <header className="h-14 border-b border-[#2a2d3a] bg-[#1a1d27] flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs text-slate-500">{userEmail}</span>
        <form action={logout}>
          <button
            type="submit"
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
