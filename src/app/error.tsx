"use client";

import Link from "next/link";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <Nav />
      <main
        className="page"
        style={{
          paddingTop: 80,
          paddingBottom: 64,
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div>
          <span
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 12,
              color: "var(--accent)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Error
          </span>
          <h1
            style={{
              fontFamily: "var(--font-newsreader, Georgia, serif)",
              fontSize: 32,
              fontWeight: 700,
              color: "var(--ink)",
              margin: "8px 0 16px",
            }}
          >
            Something went wrong.
          </h1>
          <p
            style={{
              color: "var(--ink-soft)",
              fontFamily: "var(--font-inter-tight, system-ui, sans-serif)",
              fontSize: 15,
              marginBottom: 24,
            }}
          >
            An unexpected error occurred. You can try again or return home.
          </p>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <button
              onClick={reset}
              style={{
                fontFamily: "var(--font-inter-tight, system-ui, sans-serif)",
                fontSize: 14,
                color: "var(--ink)",
                background: "transparent",
                border: "1px solid var(--rule)",
                borderRadius: 6,
                padding: "6px 16px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link href="/" className="btn-link">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
