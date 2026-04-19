import {
  BLOG_POSTS,
  EXPERIENCE,
  PROJECTS,
  SKILLS,
} from "./mock-data";
import type {
  BlogPostDetail,
  BlogPostSummary,
  ExperienceItem,
  ProjectDetail,
  ProjectSummary,
  SkillGroup,
} from "../types";

export const isMock = () =>
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.startsWith("prisma+postgres://");

export function computeReadTime(content: string | null | undefined): string {
  if (!content) return "";
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return "";
  return `${Math.max(1, Math.round(words / 200))} min`;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<ProjectSummary[]> {
  if (isMock()) {
    return PROJECTS.map((p) => ({
      slug: p.slug,
      title: p.title,
      summary: p.summary,
      techTags: p.techTags,
      type: p.type,
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
    }));
  }

  const { prisma } = await import("./prisma");
  const rows = await prisma.project.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { order: "asc" },
  });
  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    techTags: p.techTags,
    type: p.type,
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
  }));
}

export async function getProjectBySlug(
  slug: string
): Promise<ProjectDetail | null> {
  if (isMock()) {
    const found = PROJECTS.find((p) => p.slug === slug);
    if (!found) return null;
    return {
      ...found,
      content:
        "*Preview mode — no detailed content available. Edit src/lib/mock-data.ts.*",
      coverImage: null,
      featured: false,
      publishedAt: null,
    };
  }

  const { prisma } = await import("./prisma");
  const p = await prisma.project.findUnique({ where: { slug } });
  if (!p) return null;
  return {
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    techTags: p.techTags,
    type: p.type,
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
    content: p.content,
    coverImage: p.coverImage,
    featured: p.featured,
    publishedAt: p.publishedAt,
  };
}

// ─── Experience ───────────────────────────────────────────────────────────────

export async function getExperience(): Promise<ExperienceItem[]> {
  if (isMock()) {
    return EXPERIENCE;
  }

  const { prisma } = await import("./prisma");
  const rows = await prisma.experience.findMany({ orderBy: { order: "asc" } });

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });

  const typeLabel: Record<string, string> = {
    FULLTIME: "Full-time",
    PARTTIME: "Part-time",
    CONTRACT: "Contract",
    INTERNSHIP: "Internship",
    VOLUNTEER: "Volunteer",
  };

  return rows.map((exp) => {
    const period = exp.current
      ? `${fmt(exp.startDate)} — Present`
      : `${fmt(exp.startDate)} — ${fmt(exp.endDate!)}`;
    const type = typeLabel[exp.type] ?? exp.type;
    return {
      company: exp.company,
      role: exp.role,
      period,
      type,
      description: exp.description,
    };
  });
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export async function getSkills(): Promise<SkillGroup[]> {
  if (isMock()) {
    return SKILLS;
  }

  const { prisma } = await import("./prisma");
  const rows = await prisma.skill.findMany({ orderBy: { order: "asc" } });

  const categoryLabel: Record<string, string> = {
    LANGUAGE: "Languages",
    FRAMEWORK: "Frameworks & Libraries",
    TOOL: "Tools & Infrastructure",
    ROBOTICS: "Robotics & Embedded",
    EMBEDDED: "Robotics & Embedded",
    DATABASE: "Databases",
    OTHER: "Other",
  };

  const grouped = new Map<string, string[]>();
  for (const skill of rows) {
    const label = categoryLabel[skill.category] ?? skill.category;
    const existing = grouped.get(label);
    if (existing) {
      existing.push(skill.name);
    } else {
      grouped.set(label, [skill.name]);
    }
  }

  return Array.from(grouped.entries()).map(([category, skills]) => ({
    category,
    skills,
  }));
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getBlogPosts(): Promise<BlogPostSummary[]> {
  if (isMock()) {
    return BLOG_POSTS.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      date: p.date,
      readTime: p.readTime,
      tags: p.tags,
    }));
  }

  const { prisma } = await import("./prisma");
  const rows = await prisma.post.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    include: { tags: true },
  });

  return rows.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? "",
    date: p.publishedAt
      ? p.publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "",
    readTime: computeReadTime(p.content),
    tags: p.tags.map((t) => t.name),
  }));
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPostDetail | null> {
  if (isMock()) {
    const found = BLOG_POSTS.find((p) => p.slug === slug);
    if (!found) return null;
    return {
      slug: found.slug,
      title: found.title,
      excerpt: found.excerpt,
      date: found.date,
      readTime: found.readTime,
      tags: found.tags,
      content: "*Full post content is not available in preview mode.*",
      seoTitle: null,
      seoDesc: null,
      publishedAt: null,
    };
  }

  const { prisma } = await import("./prisma");
  const p = await prisma.post.findUnique({
    where: { slug, status: "PUBLISHED" },
    include: { tags: true },
  });
  if (!p) return null;

  return {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? "",
    date: p.publishedAt
      ? p.publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "",
    readTime: computeReadTime(p.content),
    tags: p.tags.map((t) => t.name),
    content: p.content,
    seoTitle: p.seoTitle,
    seoDesc: p.seoDesc,
    publishedAt: p.publishedAt,
  };
}
