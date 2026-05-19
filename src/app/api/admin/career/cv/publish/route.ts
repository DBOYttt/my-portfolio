export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { copyFile, rename, unlink } from "fs/promises";
import path from "path";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const src = path.join(process.cwd(), "public", "cv-output", "master-cv.pdf");
  const dest = path.join(process.cwd(), "public", "cv.pdf");
  const tmp = `${dest}.tmp`;

  try {
    await copyFile(src, tmp);
    await rename(tmp, dest);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    const isNotFound = (err as NodeJS.ErrnoException).code === "ENOENT";
    return NextResponse.json(
      { error: isNotFound ? "master-cv.pdf not found in cv-output volume" : `Failed to publish CV: ${(err as Error).message}` },
      { status: isNotFound ? 404 : 500 }
    );
  }
  return NextResponse.json({ ok: true, publishedAt: new Date().toISOString() });
}
