export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { careerOpsRequest } from "@/lib/career-ops-client";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const result = await careerOpsRequest("/cv/master", { method: "POST", timeout: 10_000 });
  if (!result.ok) return result.errorResponse;

  const data = (await result.response.json()) as unknown;
  return NextResponse.json(data, { status: result.response.status });
}
