"use client";

import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  { num: "01", id: "about",      label: "About" },
  { num: "02", id: "skills",     label: "Stack" },
  { num: "03", id: "projects",   label: "Projects" },
  { num: "04", id: "robotics",   label: "Robotics" },
  { num: "05", id: "experience", label: "Experience" },
  { num: "06", id: "writing",    label: "Writing" },
  { num: "07", id: "contact",    label: "Contact" },
];

export default function Nav() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("logbook-theme") as "light" | "dark" | null;
    const attr = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
    setTheme(stored ?? attr ?? "light");
  }, []);

  useEffect(() => {
    if (!menuOpen || !drawerRef.current) return;
    const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("logbook-theme", next);
  }

  return (
    <nav className="logbook-nav">
      {menuOpen && (
        <>
          <div
            className="fixed inset-0"
            style={{ zIndex: 39 }}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div ref={drawerRef} className="nav-mobile-drawer" style={{ zIndex: 40 }}>
            {SECTIONS.map((s) => (
              <a key={s.id} href={`/#${s.id}`} onClick={() => setMenuOpen(false)}>
                <span className="nav-num">{s.num}</span>
                {s.label}
              </a>
            ))}
          </div>
        </>
      )}
      <div className="logbook-nav-inner">
        <a href="/#top" className="nav-brand">
          <span style={{ fontStyle: "italic" }}>The Logbook</span>
          <span className="stamp">A.C.N. · 2026</span>
        </a>

        <div className="nav-links">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`/#${s.id}`}>
              <span className="nav-num">{s.num}</span>
              {s.label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="nav-menu-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "≡"}
          </button>
          {theme === null ? (
            <button
              className="theme-toggle"
              aria-label="Toggle theme"
              suppressHydrationWarning
              style={{ visibility: "hidden" }}
            >
              <span>{"☀  light"}</span>
            </button>
          ) : (
            <button
              className="theme-toggle"
              onClick={toggle}
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {theme === "dark" ? "☾  dark" : "☀  light"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
