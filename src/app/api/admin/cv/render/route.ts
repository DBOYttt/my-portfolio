export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { renderCvToPdf } from "@/lib/cv-template";
import type { CvContent } from "@/lib/cv-template";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const user = await prisma.user.findFirst({
    select: { cvContent: true },
  });

  if (!user?.cvContent) {
    return NextResponse.json(
      { error: "No CV content found. Generate the CV first." },
      { status: 400 }
    );
  }

  const cvContent = user.cvContent as unknown as CvContent;
  const pdfBuffer = await renderCvToPdf(cvContent);

  const outputPath = path.join(process.cwd(), "public", "cv.pdf");
  await writeFile(outputPath, pdfBuffer);

  return NextResponse.json({ ok: true });
}
