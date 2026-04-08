import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.slug !== undefined && { slug: body.slug }),
      ...(body.summary !== undefined && { summary: body.summary }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.techTags !== undefined && { techTags: body.techTags }),
      ...(body.githubUrl !== undefined && { githubUrl: body.githubUrl }),
      ...(body.liveUrl !== undefined && { liveUrl: body.liveUrl }),
      ...(body.featured !== undefined && { featured: body.featured }),
      ...(body.order !== undefined && { order: body.order }),
      ...(body.coverImage !== undefined && { coverImage: body.coverImage }),
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_PROJECT",
      entityId: project.id,
      metadata: { title: project.title },
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: {
      action: "DELETE_PROJECT",
      entityId: params.id,
      metadata: { title: existing.title },
    },
  });

  return new NextResponse(null, { status: 204 });
}
