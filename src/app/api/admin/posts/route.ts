import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: true },
  });
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
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

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: "title, slug, and content are required" },
      { status: 400 }
    );
  }

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

  try {
    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt ?? null,
        status: status ?? "DRAFT",
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        seoTitle: seoTitle ?? null,
        seoDesc: seoDesc ?? null,
        tags: { connect: tagConnects.map((t) => ({ id: t.id })) },
      },
      include: { tags: true },
    });

    await prisma.auditLog.create({
      data: { action: "CREATE_POST", entityId: post.id, metadata: { title } },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "a post with this slug already exists" }, { status: 409 });
    }
    throw e;
  }
}
