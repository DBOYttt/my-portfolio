"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SkillCategory, SkillLevel } from "@prisma/client";
import type { ProjectSuggestion } from "@/types/agent-reports";

export async function markRead(reportId: string): Promise<void> {
  await prisma.agentReport.update({
    where: { id: reportId },
    data: { readAt: new Date() },
  });
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function applySkillAdd(reportId: string, formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const category = formData.get("category") as SkillCategory;
  const level = formData.get("level") as SkillLevel;
  if (!name || !category || !level) return;
  await prisma.skill.upsert({
    where: { name },
    update: {},
    create: { name, category, level, order: 0 },
  });
  revalidatePath("/admin/skills");
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function applyAllSkillAdditions(reportId: string, formData: FormData): Promise<void> {
  const itemsJson = formData.get("items") as string;
  if (!itemsJson) return;
  let items: Array<{ name: string; category: string; level?: string }>;
  try {
    items = JSON.parse(itemsJson) as Array<{ name: string; category: string; level?: string }>;
  } catch {
    return;
  }
  await prisma.skill.createMany({
    data: items.map((i) => ({
      name: i.name,
      category: i.category as SkillCategory,
      level: (i.level ?? "FAMILIAR") as SkillLevel,
      order: 0,
    })),
    skipDuplicates: true,
  });
  revalidatePath("/admin/skills");
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function applySkillUpgrade(reportId: string, formData: FormData): Promise<void> {
  const name = formData.get("name") as string;
  const level = formData.get("level") as SkillLevel;
  if (!name || !level) return;
  const skill = await prisma.skill.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (skill) {
    await prisma.skill.update({ where: { id: skill.id }, data: { level } });
  }
  revalidatePath("/admin/skills");
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function dismissStaleSkill(reportId: string, formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  if (!id) return;
  await prisma.skill.delete({ where: { id } });
  revalidatePath("/admin/agents/reports");
  revalidatePath(`/admin/agents/reports/${reportId}`);
  revalidatePath("/");
}

export async function createProjectDraft(reportId: string, formData: FormData): Promise<void> {
  let suggestion: ProjectSuggestion;
  try {
    suggestion = JSON.parse(formData.get("suggestion") as string) as ProjectSuggestion;
  } catch {
    return;
  }
  try {
    const project = await prisma.project.create({
      data: {
        title: suggestion.title,
        slug: suggestion.slug,
        summary: suggestion.summary,
        content: suggestion.content,
        type: suggestion.type,
        techTags: suggestion.techTags,
        githubUrl: suggestion.githubUrl,
        featured: false,
        order: 0,
        publishedAt: null,
      },
    });
    redirect(`/admin/projects/${project.id}`);
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      redirect(`/admin/agents/reports/${reportId}?error=slug-exists`);
    }
    throw e;
  }
}

export async function applyProjectSyncUpdate(reportId: string, formData: FormData): Promise<void> {
  const slug = formData.get("slug") as string;
  const field = formData.get("field") as string;
  const suggestedValue = formData.get("suggestedValue") as string;
  if (!slug || !field || !suggestedValue) return;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) return;
  if (field === "summary") {
    await prisma.project.update({ where: { id: project.id }, data: { summary: suggestedValue } });
  } else if (field === "type") {
    await prisma.project.update({
      where: { id: project.id },
      data: { type: suggestedValue as "SOFTWARE" | "ROBOTICS" | "HARDWARE" | "RESEARCH" },
    });
  } else if (field === "techTags") {
    let tags: string[] = [];
    try { tags = JSON.parse(suggestedValue) as string[]; } catch { /* leave empty */ }
    await prisma.project.update({ where: { id: project.id }, data: { techTags: tags } });
  }
  revalidatePath("/admin/projects");
  revalidatePath(`/admin/agents/reports/${reportId}`);
}

export async function createSeriesDrafts(reportId: string, formData: FormData): Promise<void> {
  const postsJson = formData.get("posts") as string;
  let posts: { title: string; tags: string[] }[];
  try {
    posts = JSON.parse(postsJson) as { title: string; tags: string[] }[];
  } catch {
    return;
  }
  const toSlug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const tagNames = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const existingTags = await prisma.tag.findMany({
    where: { name: { in: tagNames } },
    select: { id: true, name: true },
  });
  const tagMap = new Map(existingTags.map((t) => [t.name, t.id]));
  const newTagNames = tagNames.filter((n) => !tagMap.has(n));
  if (newTagNames.length > 0) {
    await prisma.tag.createMany({
      data: newTagNames.map((n) => ({ name: n, slug: toSlug(n) })),
      skipDuplicates: true,
    });
    const created = await prisma.tag.findMany({
      where: { name: { in: newTagNames } },
      select: { id: true, name: true },
    });
    for (const t of created) tagMap.set(t.name, t.id);
  }

  for (const post of posts) {
    const baseSlug = toSlug(post.title);
    let slug = baseSlug;
    let attempt = 0;
    while (true) {
      const existing = await prisma.post.findUnique({ where: { slug } });
      if (!existing) break;
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }
    await prisma.post.create({
      data: {
        title: post.title,
        slug,
        content: "",
        status: "DRAFT",
        tags: {
          connect: post.tags
            .map((n) => tagMap.get(n))
            .filter((id): id is string => !!id)
            .map((id) => ({ id })),
        },
      },
    });
  }
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}
