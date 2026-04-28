"use client";

import { useState, useEffect } from "react";

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
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("logbook-theme") as "light" | "dark" | null;
    const attr = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
    setTheme(stored ?? attr ?? "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("logbook-theme", next);
  }

  return (
    <nav className="logbook-nav">
      {menuOpen && (
        <div className="nav-mobile-drawer">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`/#${s.id}`} onClick={() => setMenuOpen(false)}>
              <span className="nav-num">{s.num}</span>
              {s.label}
            </a>
          ))}
        </div>
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
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label="Toggle theme"
            suppressHydrationWarning
          >
            {theme === "dark" ? "☾  dark" : "☀  light"}
          </button>
        </div>
      </div>
    </nav>
  );
}
