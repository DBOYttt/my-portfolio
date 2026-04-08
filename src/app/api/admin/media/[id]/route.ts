import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const asset = await prisma.mediaAsset.findUnique({
    where: { id: params.id },
  });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file from disk (ignore if file is already gone)
  const filePath = join(process.cwd(), "public", asset.url);
  await unlink(filePath).catch(() => {});

  await prisma.mediaAsset.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
