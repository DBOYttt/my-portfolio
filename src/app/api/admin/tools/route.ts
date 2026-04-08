import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;
  const tools = await prisma.toolShortcut.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(tools);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;
  const body = await req.json();
  if (!body.name || !body.url) {
    return NextResponse.json({ error: "name and url are required" }, { status: 400 });
  }
  const tool = await prisma.toolShortcut.create({
    data: {
      name: body.name,
      url: body.url,
      description: body.description ?? null,
      icon: body.icon ?? null,
      openInNewTab: body.openInNewTab ?? true,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(tool, { status: 201 });
}
