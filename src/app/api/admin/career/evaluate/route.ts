export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { careerOpsRequest } from "@/lib/career-ops-client";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { url } = (await req.json()) as { url?: string };
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  const result = await careerOpsRequest("/evaluate", {
    method: "POST",
    body: { url },
    timeout: 10_000,
  });
  if (!result.ok) return result.errorResponse;

  const data = (await result.response.json()) as unknown;
  return NextResponse.json(data, { status: result.response.status });
}
