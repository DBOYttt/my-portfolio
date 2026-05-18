export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const internalUrl = process.env.CAREER_OPS_INTERNAL_URL;
  const secret = process.env.CAREER_OPS_INTERNAL_SECRET;
  if (!internalUrl)
    return NextResponse.json({ error: "Career-ops service not configured" }, { status: 503 });

  let res: Response;
  try {
    res = await fetch(`${internalUrl}/cv/master`, {
      method: "POST",
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return NextResponse.json({ error: "career-ops service unavailable" }, { status: 503 });
  }

  const data = (await res.json()) as unknown;
  return NextResponse.json(data, { status: res.status });
}
