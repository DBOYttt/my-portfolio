export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("pdf");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5 MB." },
      { status: 413 }
    );
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const outputPath = path.join(process.cwd(), "public", "cv.pdf");
  await writeFile(outputPath, buffer);

  const user = await prisma.user.findFirst({ select: { id: true } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        cvSource: "manual",
        cvGeneratedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
