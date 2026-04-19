import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (!checkRateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, message, honeypot } = body as Record<string, string>;

  // Honeypot: bots fill hidden fields, humans don't. Return 200 silently so bots don't know.
  if (honeypot) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (
    !name?.trim() ||
    !email?.trim() ||
    !message?.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    // Mock mode / missing config — log and succeed silently
    console.log("[contact] RESEND_API_KEY not set — skipping email delivery:", { name, email });
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL ?? "noreply@yourdomain.com",
      to: process.env.CONTACT_EMAIL!,
      subject: `Portfolio contact: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p>${message.replace(/\n/g, "<br>")}</p>`,
    });
  } catch (err) {
    console.error("[contact] Resend delivery failed:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
