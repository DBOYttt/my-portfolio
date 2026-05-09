"use client";

import { useState, FormEvent } from "react";
import { OWNER } from "@/lib/mock-data";
import { SectionHead, HandCheck } from "@/components/ui/hand-drawn";

function Field({
  id,
  label,
  k,
  error,
  children,
}: {
  id: string;
  label: string;
  k: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <label
          htmlFor={id}
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}
        >
          <span style={{ color: "var(--accent)" }}>{k}</span>&nbsp; {label}
        </label>
        {error ? (
          <span className="mono" style={{ fontSize: 11, color: "var(--accent)", fontStyle: "italic" }}>
            !! {error}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default function ContactSection() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [touched, setTouched] = useState({ name: false, email: false, message: false });
  const [honeypot, setHoneypot] = useState("");

  const emailValid = /\S+@\S+\.\S+/.test(form.email);
  const valid = form.name.trim() && emailValid && form.message.trim().length > 8;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) {
      setTouched({ name: true, email: true, message: true });
      return;
    }
    setSending(true);
    setSendError(false);
    setRateLimited(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message, honeypot }),
      });
      if (res.ok) {
        setSent(true);
      } else if (res.status === 429) {
        setRateLimited(true);
      } else {
        setSendError(true);
      }
    } catch {
      setSendError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="logbook-section" style={{ paddingBottom: 40 }}>
      <SectionHead
        num="07"
        kicker="Contact"
        meta="Cold emails welcome"
        title={<>Drop a <em>line.</em></>}
        sub="Best for new projects, collaborations, or just a chat about robotics, automation, or the strange middle ground between."
      />
      <div className="logbook-row">
        <aside className="margin">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>email</div>
              <a href={`mailto:${OWNER.email}`} style={{ fontSize: 13.5, wordBreak: "break-all", color: "var(--ink)", textDecoration: "none", borderBottom: "1px solid var(--hairline)" }}>
                {OWNER.email}
              </a>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>github</div>
              <a href={OWNER.github} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, color: "var(--ink)" }}>@DBOYttt</a>
            </div>
            <div>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>linkedin</div>
              <a href={OWNER.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, color: "var(--ink)" }}>andrzej-nazim</a>
            </div>
          </div>
        </aside>

        <div>
          {sent ? (
            <div style={{ padding: "32px 0", borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <HandCheck size={26} color="var(--accent)" thickness={2} />
                <h3 className="serif" style={{ fontSize: 28, fontWeight: 500 }}>Logged.</h3>
              </div>
              <p style={{ fontSize: 17, maxWidth: "44ch", color: "var(--ink-soft)" }}>
                Thanks, {form.name.split(" ")[0] || "friend"}. Your message has been entered into
                the logbook. I&apos;ll write back within a couple of days.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="stack" style={{ ["--gap" as string]: "20px", maxWidth: 620 }}>
              {/* Honeypot — hidden from real users, filled only by bots */}
              <input
                aria-hidden="true"
                tabIndex={-1}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
              />

              <Field id="contact-name" label="Name" k="01" error={touched.name && !form.name.trim() ? "required" : null}>
                <input
                  id="contact-name"
                  name="name"
                  className="logbook-field-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  placeholder="how should I address you?"
                  autoComplete="name"
                />
              </Field>

              <Field id="contact-email" label="Email" k="02" error={touched.email && !emailValid ? "expected an email" : null}>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  className="logbook-field-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  placeholder="you@somewhere.com"
                  autoComplete="email"
                />
              </Field>

              <Field id="contact-message" label="Message" k="03" error={touched.message && form.message.trim().length <= 8 ? "too short" : null}>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={5}
                  className="logbook-field-input"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  onBlur={() => setTouched({ ...touched, message: true })}
                  placeholder="what's on your mind?"
                />
              </Field>

              {rateLimited && (
                <p className="mono" style={{ fontSize: 12, color: "var(--accent)", letterSpacing: "0.04em" }}>
                  Too many messages — please wait an hour and try again.
                </p>
              )}
              {sendError && (
                <p className="mono" style={{ fontSize: 12, color: "var(--accent)", letterSpacing: "0.04em" }}>
                  Something went wrong. Email me directly at {OWNER.email}.
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.06em" }}>
                  Sent via the logbook · No newsletter, ever.
                </span>
                <button
                  type="submit"
                  disabled={sending}
                  className="btn-link"
                  style={{ fontSize: 19, fontStyle: "italic", opacity: sending ? 0.6 : 1 }}
                >
                  {sending ? "Sending…" : "Send entry"} <span className="arr">→</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
