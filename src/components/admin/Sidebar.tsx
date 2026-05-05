"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { label: "Dashboard", href: "/admin" },
  { label: "Blog", href: "/admin/blog" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Skills", href: "/admin/skills" },
  { label: "Experience", href: "/admin/experience" },
  { label: "Media", href: "/admin/media" },
  { label: "Agents", href: "/admin/agents" },
  { label: "MCP", href: "/admin/mcp" },
  { label: "CV", href: "/admin/cv" },
  { label: "Tools", href: "/admin/tools" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-[#1a1d27] border-r border-[#2a2d3a] flex flex-col z-50 transform transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:z-40`}
      >
        <div className="p-6 border-b border-[#2a2d3a]">
          <span className="font-mono text-cyan-400 text-sm font-semibold">&gt; admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navLinks.map(({ label, href }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "text-cyan-400 bg-cyan-500/10 font-medium"
                    : "text-slate-400 hover:text-slate-100 hover:bg-[#0f1117]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
