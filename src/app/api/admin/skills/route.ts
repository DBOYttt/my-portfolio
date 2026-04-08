import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;
  const skills = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });
  return NextResponse.json(skills);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;
  const body = await req.json();
  if (!body.name || !body.category) {
    return NextResponse.json({ error: "name and category are required" }, { status: 400 });
  }
  const skill = await prisma.skill.create({
    data: {
      name: body.name,
      category: body.category,
      level: body.level ?? null,
      order: body.order ?? 0,
    },
  });
  return NextResponse.json(skill, { status: 201 });
}
