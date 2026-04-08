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
