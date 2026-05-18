export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { copyFile, rename, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const src = path.join(process.cwd(), "public", "cv-output", "master-cv.pdf");
  const dest = path.join(process.cwd(), "public", "cv.pdf");

  if (!existsSync(src)) {
    return NextResponse.json(
      { error: "master-cv.pdf not found in cv-output volume" },
      { status: 404 }
    );
  }

  const tmp = `${dest}.tmp`;
  try {
    await copyFile(src, tmp);
    await rename(tmp, dest);
  } catch (err) {
    await unlink(tmp).catch(() => {});
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to publish CV: ${msg}` }, { status: 500 });
  }
  return NextResponse.json({ ok: true, publishedAt: new Date().toISOString() });
}
