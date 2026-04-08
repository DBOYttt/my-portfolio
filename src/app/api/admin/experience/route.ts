import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;
  const items = await prisma.experience.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;
  const body = await req.json();
  if (!body.company || !body.role || !body.startDate) {
    return NextResponse.json({ error: "company, role, and startDate are required" }, { status: 400 });
  }
  const item = await prisma.experience.create({
    data: {
      company: body.company,
      role: body.role,
      description: body.description ?? "",
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      current: body.current ?? false,
      location: body.location ?? null,
      type: body.type ?? "FULLTIME",
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
