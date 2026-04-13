export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import type { CvContent } from "@/lib/cv-template";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const user = await prisma.user.findFirst({
    select: { cvContent: true, cvGeneratedAt: true, cvSource: true },
  });

  if (!user) {
    return NextResponse.json({ cvContent: null, cvGeneratedAt: null, cvSource: "manual" });
  }

  return NextResponse.json({
    cvContent: user.cvContent ?? null,
    cvGeneratedAt: user.cvGeneratedAt ?? null,
    cvSource: user.cvSource,
  });
}

export async function PUT(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  let body: { cvContent: CvContent };
  try {
    body = (await req.json()) as { cvContent: CvContent };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.cvContent || typeof body.cvContent !== "object") {
    return NextResponse.json({ error: "cvContent is required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({ select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      cvContent: body.cvContent as object,
      cvGeneratedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
