export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { careerOpsRequest } from "@/lib/career-ops-client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const { jobId } = await params;
  const result = await careerOpsRequest(`/status/${jobId}`, { timeout: 5_000 });
  if (!result.ok) return result.errorResponse;

  const data = (await result.response.json()) as unknown;
  return NextResponse.json(data, { status: result.response.status });
}
