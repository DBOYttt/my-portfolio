"use client";

import { useEffect, useRef } from "react";

export default function CodeCopyEnhancer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll("pre > code");
    const buttons: HTMLButtonElement[] = [];

    codeBlocks.forEach((code) => {
      const pre = code.parentElement as HTMLPreElement;
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.textContent = "Copy";
      btn.setAttribute("aria-label", "Copy code to clipboard");

      btn.addEventListener("click", () => {
        navigator.clipboard.writeText(code.textContent ?? "").then(() => {
          btn.textContent = "Copied!";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 2000);
        });
      });

      pre.appendChild(btn);
      buttons.push(btn);
    });

    return () => {
      buttons.forEach((btn) => btn.remove());
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
