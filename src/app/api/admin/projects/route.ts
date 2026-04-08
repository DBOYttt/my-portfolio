import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const projects = await prisma.project.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = await req.json();
  const {
    title,
    slug,
    summary,
    content,
    type,
    techTags,
    githubUrl,
    liveUrl,
    featured,
    order,
    coverImage,
  } = body;

  if (!title || !slug || !summary || !content) {
    return NextResponse.json(
      { error: "title, slug, summary, and content are required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      title,
      slug,
      summary,
      content,
      type: type ?? "SOFTWARE",
      techTags: Array.isArray(techTags) ? techTags : [],
      githubUrl: githubUrl ?? null,
      liveUrl: liveUrl ?? null,
      featured: featured ?? false,
      order: order ?? 0,
      coverImage: coverImage ?? null,
    },
  });

  await prisma.auditLog.create({
    data: { action: "CREATE_PROJECT", entityId: project.id, metadata: { title } },
  });

  return NextResponse.json(project, { status: 201 });
}
