export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;
  return NextResponse.json(
    { error: "CV generator has been replaced by career-ops" },
    { status: 410 }
  );
}
