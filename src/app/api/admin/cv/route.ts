export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;
  return NextResponse.json(
    { error: "CV generator has been replaced by career-ops" },
    { status: 410 }
  );
}

export async function PUT() {
  const { error } = await requireAdminSession();
  if (error) return error;
  return NextResponse.json(
    { error: "CV generator has been replaced by career-ops" },
    { status: 410 }
  );
}
