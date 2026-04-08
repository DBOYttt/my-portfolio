import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { tags: true },
  });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const {
    title,
    slug,
    content,
    excerpt,
    status,
    seoTitle,
    seoDesc,
    scheduledFor,
    tags: tagNames,
  } = body;

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tagConnects = tagNames?.length
    ? await Promise.all(
        (tagNames as string[]).map((name) =>
          prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
          })
        )
      )
    : [];

  const wasPublished =
    existing.status !== "PUBLISHED" && status === "PUBLISHED";

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(slug !== undefined && { slug }),
      ...(content !== undefined && { content }),
      excerpt: excerpt ?? null,
      status: status ?? existing.status,
      publishedAt: wasPublished ? new Date() : existing.publishedAt,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      seoTitle: seoTitle ?? null,
      seoDesc: seoDesc ?? null,
      tags: { set: tagConnects.map((t) => ({ id: t.id })) },
    },
    include: { tags: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "UPDATE_POST",
      entityId: post.id,
      metadata: { title: post.title },
    },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.post.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: {
      action: "DELETE_POST",
      entityId: params.id,
      metadata: { title: existing.title },
    },
  });

  return new NextResponse(null, { status: 204 });
}
