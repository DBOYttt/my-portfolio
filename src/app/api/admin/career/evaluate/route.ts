export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  const internalUrl = process.env.CAREER_OPS_INTERNAL_URL;
  const secret = process.env.CAREER_OPS_INTERNAL_SECRET;
  if (!internalUrl)
    return NextResponse.json({ error: "Career-ops service not configured" }, { status: 503 });

  const res = await fetch(`${internalUrl}/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
    },
    body: JSON.stringify({ url }),
  });

  const data = (await res.json()) as unknown;
  return NextResponse.json(data, { status: res.status });
}
