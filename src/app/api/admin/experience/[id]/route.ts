import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;
  const body = await req.json();
  const item = await prisma.experience.update({
    where: { id: params.id },
    data: {
      ...(body.company !== undefined && { company: body.company }),
      ...(body.role !== undefined && { role: body.role }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
      ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
      ...(body.current !== undefined && { current: body.current }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdminSession();
  if (error) return error;
  await prisma.experience.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
