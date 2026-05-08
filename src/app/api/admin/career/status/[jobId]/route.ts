export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { jobId } = await params;
  const internalUrl = process.env.CAREER_OPS_INTERNAL_URL;
  const secret = process.env.CAREER_OPS_INTERNAL_SECRET;
  if (!internalUrl)
    return NextResponse.json({ error: "Career-ops service not configured" }, { status: 503 });

  const res = await fetch(`${internalUrl}/status/${jobId}`, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });

  const data = (await res.json()) as unknown;
  return NextResponse.json(data, { status: res.status });
}
