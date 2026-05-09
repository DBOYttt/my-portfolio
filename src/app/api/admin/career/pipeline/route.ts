export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const internalUrl = process.env.CAREER_OPS_INTERNAL_URL;
  const secret = process.env.CAREER_OPS_INTERNAL_SECRET;
  if (!internalUrl) return NextResponse.json({ jobs: [] });

  try {
    const res = await fetch(`${internalUrl}/pipeline`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    const data = (await res.json()) as unknown;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ jobs: [] });
  }
}
