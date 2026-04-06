import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiter (use Upstash Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 5;

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  if (!checkRateLimit(ip)) {
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

  const { name, email, message } = body as Record<string, string>;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !message?.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  // TODO: Replace with Resend or another email provider
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "portfolio@yourdomain.com",
  //   to: process.env.CONTACT_EMAIL!,
  //   subject: `Portfolio contact from ${name}`,
  //   text: `From: ${name} <${email}>\n\n${message}`,
  // });

  console.log("[contact] Message received:", { name, email, message });

  return NextResponse.json({ success: true }, { status: 200 });
}
