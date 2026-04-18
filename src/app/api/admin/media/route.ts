import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { uploadedAt: "desc" },
  });
  return NextResponse.json(assets);
}

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;
  return NextResponse.json(
    { error: "File uploads must go to /api/admin/media/upload" },
    { status: 405, headers: { Allow: "GET" } }
  );
}
