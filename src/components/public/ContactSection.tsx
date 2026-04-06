"use client";

import { useState, FormEvent } from "react";
import { OWNER } from "@/lib/mock-data";

export default function ContactSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
        form.reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="py-24 border-t border-[#2a2d3a]">
      <div className="section-container">
        <div className="max-w-2xl">
          <h2 className="section-heading">Get in Touch</h2>
          <div className="accent-line" />

          <p className="text-slate-400 mb-8 leading-relaxed">
            I&apos;m open to software engineering roles, robotics projects, and
            interesting collaboration. Fill in the form or reach out directly.
          </p>

          <div className="mb-8 flex gap-4 flex-wrap">
            <a
              href={`mailto:${OWNER.email}`}
              className="font-mono text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {OWNER.email}
            </a>
            <span className="text-[#2a2d3a]">|</span>
            <a
              href={OWNER.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              LinkedIn
            </a>
            <span className="text-[#2a2d3a]">|</span>
            <a
              href={OWNER.github}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm text-slate-400 mb-1.5">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm text-slate-400 mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                className="w-full bg-[#1a1d27] border border-[#2a2d3a] rounded-lg px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors text-sm resize-none"
                placeholder="Tell me about your project or role..."
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>

            {status === "success" && (
              <p className="text-emerald-400 text-sm">
                Message sent. I&apos;ll get back to you shortly.
              </p>
            )}
            {status === "error" && (
              <p className="text-red-400 text-sm">
                Something went wrong. Please email me directly.
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
