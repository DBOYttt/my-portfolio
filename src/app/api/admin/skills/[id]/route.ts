import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;
  const body = await req.json();
  const skill = await prisma.skill.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.level !== undefined && { level: body.level }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });
  return NextResponse.json(skill);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;
  await prisma.skill.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
