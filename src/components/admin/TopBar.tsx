"use client";
import { logout } from "@/app/admin/actions";

interface TopBarProps {
  userEmail: string;
  onMenuOpen: () => void;
}

export default function TopBar({ userEmail, onMenuOpen }: TopBarProps) {
  return (
    <header className="h-14 border-b border-[#2a2d3a] bg-[#1a1d27] flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <button
        type="button"
        onClick={onMenuOpen}
        className="md:hidden p-2 text-slate-400 hover:text-slate-100 transition-colors"
        aria-label="Open navigation menu"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <rect y="3" width="20" height="2" rx="1" />
          <rect y="9" width="20" height="2" rx="1" />
          <rect y="15" width="20" height="2" rx="1" />
        </svg>
      </button>
      <div className="hidden md:block" />
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
