import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const report = await prisma.agentReport.update({
    where: { id: params.id },
    data: { readAt: new Date() },
  });
  return NextResponse.json(report);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  await prisma.agentReport.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
