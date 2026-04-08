import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;
  const body = await req.json();
  const tool = await prisma.toolShortcut.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.openInNewTab !== undefined && { openInNewTab: body.openInNewTab }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });
  return NextResponse.json(tool);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;
  await prisma.toolShortcut.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
