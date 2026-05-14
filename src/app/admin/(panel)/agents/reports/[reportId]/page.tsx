import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErrorParamCleaner } from "./ErrorParamCleaner";

export const metadata: Metadata = { title: "Report" };
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SkillCategory, SkillLevel } from "@prisma/client";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import type {
  GitHubAuditRawData,
  ActivityLevel,
} from "@/lib/agents/github-summarizer";
import type {
  ProjectSyncUpdate,
  ProjectSyncDiffRawData,
} from "@/lib/agents/github-project-importer";
import type {
  ProfileConsistencyRow,
  PlatformSyncRawData,
} from "@/lib/agents/platform-sync";
import type {
  DigestItem,
  RoboticsDigestRawData,
} from "@/lib/agents/robotics-news";
import {
  isRecord,
  type SkillsDiffRawData,
  type ProjectSuggestion,
  type ProjectSuggestionsRawData,
  type ProjectCreatedRawData,
  type BrandMonitorRawData,
  type BlogSuggesterRawData,
} from "@/types/agent-reports";

function ActivityBadge({ level }: { level: ActivityLevel }) {
  if (level === "active") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        Active
      </span>
    );
  }
  if (level === "recent") {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
        Recent
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-400">
      Dormant
    </span>
  );
}

function ConsistencyBadge({ status }: { status: "match" | "mismatch" | "missing" }) {
  if (status === "match") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        Match
      </span>
    );
  }
  if (status === "mismatch") {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
        Mismatch
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-500">
      Missing
    </span>
  );
}

const typeColors: Record<string, string> = {
  ROBOTICS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  SOFTWARE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  HARDWARE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  RESEARCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: { reportId: string };
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [report, currentSkills, currentProjects] = await Promise.all([
    prisma.agentReport.findUnique({
      where: { id: params.reportId },
      include: { agent: true },
    }),
    prisma.skill.findMany({ select: { id: true, name: true } }),
    prisma.project.findMany({ select: { slug: true, githubUrl: true } }),
  ]);
  if (!report) notFound();

  const appliedSkillNames = new Set(currentSkills.map((s) => s.name.toLowerCase()));
  const skillIdByName = new Map(currentSkills.map((s) => [s.name.toLowerCase(), s.id]));
  const existingProjectSlugs = new Set(currentProjects.map((p) => p.slug.toLowerCase()));
  const existingProjectGithubUrls = new Set(
    currentProjects.map((p) => p.githubUrl?.toLowerCase()).filter(Boolean)
  );

  const reportId = params.reportId;

  async function markRead() {
    "use server";
    await prisma.agentReport.update({
      where: { id: reportId },
      data: { readAt: new Date() },
    });
    revalidatePath(`/admin/agents/reports/${reportId}`);
  }

  async function applySkillAdd(formData: FormData) {
    "use server";
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

  async function applyAllSkillAdditions(formData: FormData) {
    "use server";
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

  async function applySkillUpgrade(formData: FormData) {
    "use server";
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

  async function dismissStaleSkill(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    await prisma.skill.delete({ where: { id } });
    revalidatePath("/admin/agents/reports");
    revalidatePath(`/admin/agents/reports/${reportId}`);
    revalidatePath("/");
  }

  async function createProjectDraft(formData: FormData) {
    "use server";
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

  async function applyProjectSyncUpdate(formData: FormData) {
    "use server";
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

  async function createSeriesDrafts(formData: FormData) {
    "use server";
    const postsJson = formData.get("posts") as string;
    let posts: { title: string; tags: string[] }[];
    try {
      posts = JSON.parse(postsJson) as { title: string; tags: string[] }[];
    } catch {
      return;
    }
    try {
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
    } catch (e: unknown) {
      const isRedirect =
        e instanceof Error && e.message === "NEXT_REDIRECT";
      if (isRedirect) throw e;
      throw e;
    }
  }

  const rawData = isRecord(report.rawData) ? report.rawData : null;
  const rawDataType = rawData ? rawData.type : null;

  const isSkillsDiff =
    report.agent.type === "SKILLS_INFERENCE" && rawDataType === "SKILLS_DIFF";

  const isProjectSuggestions =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_SUGGESTIONS";

  const isProjectCreated =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_CREATED";

  const isProjectSyncDiff =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_SYNC_DIFF";

  const isGitHubAudit =
    report.agent.type === "GITHUB_SUMMARIZER" && rawDataType === "GITHUB_AUDIT";

  const isBrandMonitor =
    report.agent.type === "BRAND_MONITOR" &&
    rawData !== null &&
    ("githubDelta" in rawData || "googleAlerts" in rawData || "devToMentions" in rawData);

  const isBlogSuggester =
    report.agent.type === "BLOG_SUGGESTER" &&
    rawData !== null &&
    Array.isArray(rawData.suggestions);

  const isRoboticsDigest =
    report.agent.type === "ROBOTICS_NEWS" && rawDataType === "ROBOTICS_DIGEST";

  const isPlatformSync =
    report.agent.type === "PLATFORM_SYNC" &&
    rawData !== null &&
    "configuredPlatforms" in rawData;

  const skillsDiff = isSkillsDiff ? (rawData as unknown as SkillsDiffRawData) : null;
  const projectSuggestions = isProjectSuggestions
    ? (rawData as unknown as ProjectSuggestionsRawData)
    : null;
  const projectCreated = isProjectCreated
    ? (rawData as unknown as ProjectCreatedRawData)
    : null;
  const projectSyncDiff = isProjectSyncDiff
    ? (rawData as unknown as ProjectSyncDiffRawData)
    : null;
  const githubAudit = isGitHubAudit ? (rawData as unknown as GitHubAuditRawData) : null;
  const brandMonitorData = isBrandMonitor ? (rawData as unknown as BrandMonitorRawData) : null;
  const blogSuggesterData = isBlogSuggester
    ? (rawData as unknown as BlogSuggesterRawData)
    : null;
  const roboticsDigestData = isRoboticsDigest
    ? (rawData as unknown as RoboticsDigestRawData)
    : null;
  const platformSyncData = isPlatformSync
    ? (rawData as unknown as PlatformSyncRawData)
    : null;

  const errorParam = searchParams.error;

  return (
    <div className="max-w-4xl">
      <ErrorParamCleaner hasError={!!errorParam} />
      {errorParam === "slug-exists" && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          A project with this slug already exists — edit the slug in the{" "}
          <a href="/admin/projects" className="underline hover:text-red-300">
            Projects page
          </a>{" "}
          before trying again.
        </div>
      )}
      <div className="mb-6">
        <Link
          href={`/admin/agents/${report.agentId}`}
          className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors"
        >
          ← {report.agent.name}
        </Link>
        <div className="flex items-start justify-between mt-2 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{report.title}</h1>
            <p className="text-slate-500 text-xs font-mono mt-1">
              {report.createdAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {report.readAt ? " · read" : " · unread"}
            </p>
          </div>
          {!report.readAt && (
            <form action={markRead} className="flex-shrink-0 mt-1">
              <button type="submit" className="btn-secondary text-xs py-1.5 px-3">
                Mark as read
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Skills Diff UI */}
      {skillsDiff && (
        <div className="space-y-6 mb-6">
          {skillsDiff.add.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a] flex items-center justify-between gap-3 flex-wrap">
                <p className="text-slate-100 text-sm font-medium">
                  Skills to Add ({skillsDiff.add.length})
                </p>
                {/* SI-B: Batch apply button */}
                {skillsDiff.add.some((s) => !appliedSkillNames.has(s.name.toLowerCase())) && (
                  <form action={applyAllSkillAdditions}>
                    <input
                      type="hidden"
                      name="items"
                      value={JSON.stringify(
                        skillsDiff.add
                          .filter((s) => !appliedSkillNames.has(s.name.toLowerCase()))
                          .map((s) => ({ name: s.name, category: s.category, level: s.level }))
                      )}
                    />
                    <button
                      type="submit"
                      className="text-xs py-1.5 px-3 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                    >
                      Apply all{" "}
                      {skillsDiff.add.filter((s) => !appliedSkillNames.has(s.name.toLowerCase())).length}{" "}
                      additions
                    </button>
                  </form>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2d3a]">
                    <th className="text-left px-4 py-2 text-slate-500 font-medium">Name</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-medium">Category</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-medium">Level</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">Evidence</th>
                    <th className="text-right px-4 py-2 text-slate-500 font-medium">Apply</th>
                  </tr>
                </thead>
                <tbody>
                  {skillsDiff.add.map((s, i) => {
                    const isApplied = appliedSkillNames.has(s.name.toLowerCase());
                    return (
                      <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                        <td className="px-4 py-2.5">
                          <span className="text-slate-100 font-medium">{s.name}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{s.category}</td>
                        <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{s.level}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs hidden md:table-cell max-w-xs truncate">
                          {s.evidence}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {isApplied ? (
                            <span className="text-xs py-1 px-2.5 text-slate-500 border border-slate-700 rounded-lg cursor-default">
                              Applied ✓
                            </span>
                          ) : (
                            <form action={applySkillAdd}>
                              <input type="hidden" name="name" value={s.name} />
                              <input type="hidden" name="category" value={s.category} />
                              <input type="hidden" name="level" value={s.level} />
                              <button
                                type="submit"
                                className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                              >
                                Apply
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {skillsDiff.upgrade.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a]">
                <p className="text-slate-100 text-sm font-medium">
                  Skills to Upgrade ({skillsDiff.upgrade.length})
                </p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2d3a]">
                    <th className="text-left px-4 py-2 text-slate-500 font-medium">Name</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-medium">Level Change</th>
                    <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">Evidence</th>
                    <th className="text-right px-4 py-2 text-slate-500 font-medium">Apply</th>
                  </tr>
                </thead>
                <tbody>
                  {skillsDiff.upgrade.map((s, i) => (
                    <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                      <td className="px-4 py-2.5 text-slate-100 font-medium">{s.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        <span className="text-slate-400">{s.currentLevel}</span>
                        <span className="text-slate-600 mx-1.5">→</span>
                        <span className="text-cyan-400">{s.suggestedLevel}</span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 text-xs hidden md:table-cell max-w-xs truncate">
                        {s.evidence}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <form action={applySkillUpgrade}>
                          <input type="hidden" name="name" value={s.name} />
                          <input type="hidden" name="level" value={s.suggestedLevel} />
                          <button
                            type="submit"
                            className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                          >
                            Apply
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {skillsDiff.stale.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a]">
                <p className="text-slate-100 text-sm font-medium">
                  Possibly Stale ({skillsDiff.stale.length})
                </p>
              </div>
              <ul className="divide-y divide-[#2a2d3a]">
                {skillsDiff.stale.map((s, i) => {
                  const skillId = skillIdByName.get(s.name.toLowerCase());
                  return (
                    <li key={i} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-slate-100 text-sm font-medium min-w-32">{s.name}</span>
                      <span className="text-slate-500 text-xs flex-1">{s.reason}</span>
                      {skillId && (
                        <form action={dismissStaleSkill} className="flex-shrink-0">
                          <input type="hidden" name="id" value={skillId} />
                          <button
                            type="submit"
                            className="text-xs py-1 px-2.5 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Project Sync Diff UI (GPI-A) */}
      {projectSyncDiff && (
        <div className="mb-6">
          <p className="text-slate-100 text-sm font-medium mb-3">
            Project Sync Suggestions ({projectSyncDiff.updates.length})
          </p>
          {projectSyncDiff.updates.length === 0 ? (
            <div className="card p-4">
              <p className="text-slate-500 text-sm">All portfolio entries appear up-to-date.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2d3a]">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Project</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Field</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">Current</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Suggested</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium hidden lg:table-cell">Reason</th>
                      <th className="text-right px-4 py-2 text-slate-500 font-medium">Apply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectSyncDiff.updates.map((u: ProjectSyncUpdate, i: number) => (
                      <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{u.slug}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{u.field}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[140px] truncate hidden md:table-cell">
                          {u.currentValue}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-cyan-400 max-w-[160px] truncate">
                          {u.suggestedValue}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate hidden lg:table-cell">
                          {u.reason}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <form action={applyProjectSyncUpdate}>
                            <input type="hidden" name="slug" value={u.slug} />
                            <input type="hidden" name="field" value={u.field} />
                            <input type="hidden" name="suggestedValue" value={u.suggestedValue} />
                            <button
                              type="submit"
                              className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                            >
                              Apply
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Project Suggestions UI */}
      {projectSuggestions && projectSuggestions.suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-slate-100 text-sm font-medium mb-3">
            Project Drafts ({projectSuggestions.suggestions.length})
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {projectSuggestions.suggestions.map((s, i) => {
              const alreadyExists =
                existingProjectSlugs.has(s.slug.toLowerCase()) ||
                !!(s.githubUrl && existingProjectGithubUrls.has(s.githubUrl.toLowerCase()));
              return (
              <div key={i} className={`card p-4 flex flex-col gap-3 ${alreadyExists ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-100 font-medium text-sm truncate">{s.title}</p>
                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{s.summary}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${typeColors[s.type] ?? typeColors.SOFTWARE}`}
                  >
                    {s.type.charAt(0) + s.type.slice(1).toLowerCase()}
                  </span>
                </div>

                {s.techTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {s.techTags.slice(0, 5).map((tag) => (
                      <span key={tag} className="tag text-xs">
                        {tag}
                      </span>
                    ))}
                    {s.techTags.length > 5 && (
                      <span className="text-xs text-slate-600">+{s.techTags.length - 5}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                  <a
                    href={s.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors truncate"
                  >
                    {s.githubUrl.replace("https://github.com/", "github/")}
                  </a>
                  {alreadyExists ? (
                    <span className="text-xs py-1 px-2.5 text-slate-500 border border-slate-700 rounded-lg flex-shrink-0 cursor-default">
                      Already exists
                    </span>
                  ) : (
                    <form action={createProjectDraft}>
                      <input type="hidden" name="suggestion" value={JSON.stringify(s)} />
                      <button
                        type="submit"
                        className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors flex-shrink-0"
                      >
                        Create as Draft
                      </button>
                    </form>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Project Created UI (new auto-import reports) */}
      {projectCreated && (
        <div className="mb-6">
          <p className="text-slate-100 text-sm font-medium mb-3">
            Projects Created ({projectCreated.created.length})
          </p>
          {projectCreated.created.length === 0 ? (
            <div className="card p-4">
              <p className="text-slate-500 text-sm">All repositories are already in the portfolio.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <ul className="divide-y divide-[#2a2d3a]">
                {projectCreated.created.map((p) => (
                  <li key={p.id} className="flex flex-col gap-1 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs px-2 py-0.5 rounded border flex-shrink-0 ${typeColors[p.type] ?? typeColors.SOFTWARE}`}>
                          {p.type.charAt(0) + p.type.slice(1).toLowerCase()}
                        </span>
                        {typeof p.readmeScore === "number" && (
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border font-mono flex-shrink-0 ${
                              p.readmeScore <= 2
                                ? "border-red-500/20 bg-red-500/10 text-red-400"
                                : p.readmeScore === 3
                                ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                            }`}
                            title={`README score: ${p.readmeScore}/5`}
                          >
                            README {p.readmeScore}/5
                          </span>
                        )}
                        <span className="text-slate-100 text-sm font-medium truncate">{p.title}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={p.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors hidden md:block"
                        >
                          {p.githubUrl.replace("https://github.com/", "github/")}
                        </a>
                        <Link
                          href={`/admin/projects/${p.id}`}
                          className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                        >
                          Edit draft →
                        </Link>
                      </div>
                    </div>
                    {p.readmeNote && (
                      <p className="text-xs text-amber-400 ml-0.5">{p.readmeNote}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CV Targeted Report removed — superseded by career-ops */}
      {false && (
        <div className="mb-6 space-y-4">
          <p className="text-slate-100 text-sm font-medium">Targeted CV Report</p>

          {/* PDF download links */}
          <div className="card p-4 flex flex-wrap gap-3 items-center">
            <a
              href={""}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Robotics-heavy PDF
            </a>
            <a
              href={""}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Software-heavy PDF
            </a>
          </div>
        </div>
      )}

      {/* GitHub Audit UI */}
      {githubAudit && (
        <div className="space-y-4 mb-6">
          {/* Activity summary chips */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              {githubAudit.activitySummary.active} Active
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              {githubAudit.activitySummary.recent} Recent
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
              {githubAudit.activitySummary.dormant} Dormant
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[#2a2d3a] text-slate-500">
              {githubAudit.repoCount} repos total
            </span>
          </div>

          {/* Portfolio Gaps — most important, shown first */}
          <details open className="card overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
              <p className="text-slate-100 text-sm font-medium">
                Portfolio Gaps
                {githubAudit.portfolioGaps.length > 0 && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    {githubAudit.portfolioGaps.length}
                  </span>
                )}
              </p>
              <span className="text-slate-600 text-xs font-mono">toggle</span>
            </summary>
            {githubAudit.portfolioGaps.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">
                All notable repos are already in the portfolio.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2d3a]">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Repo</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Stars</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Activity</th>
                      <th className="text-right px-4 py-2 text-slate-500 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {githubAudit.portfolioGaps.map((gap, i) => (
                      <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                        <td className="px-4 py-2.5">
                          <a
                            href={gap.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-100 font-medium hover:text-cyan-400 transition-colors font-mono text-xs"
                          >
                            {gap.repo}
                          </a>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">
                          {gap.stars > 0 ? `${gap.stars} ★` : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <ActivityBadge level={gap.activity} />
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            href={gap.importUrl}
                            className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors"
                          >
                            Import →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>

          {/* Missing Descriptions */}
          <details className="card overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
              <p className="text-slate-100 text-sm font-medium">
                Missing Descriptions
                {githubAudit.missingDescriptions.length > 0 && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/40">
                    {githubAudit.missingDescriptions.length}
                  </span>
                )}
              </p>
              <span className="text-slate-600 text-xs font-mono">toggle</span>
            </summary>
            {githubAudit.missingDescriptions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">All repos have descriptions.</p>
            ) : (
              <ul className="divide-y divide-[#2a2d3a]">
                {githubAudit.missingDescriptions.map((r, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <span className="font-mono text-xs text-slate-300">{r.repo}</span>
                    <a
                      href={`${r.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                    >
                      Edit on GitHub →
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </details>

          {/* Missing READMEs */}
          <details className="card overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
              <p className="text-slate-100 text-sm font-medium">
                Missing READMEs
                {githubAudit.missingReadmes.length > 0 && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/40">
                    {githubAudit.missingReadmes.length}
                  </span>
                )}
              </p>
              <span className="text-slate-600 text-xs font-mono">toggle</span>
            </summary>
            {githubAudit.missingReadmes.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">All checked repos have READMEs.</p>
            ) : (
              <ul className="divide-y divide-[#2a2d3a]">
                {githubAudit.missingReadmes.map((r, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <span className="font-mono text-xs text-slate-300">{r.repo}</span>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                    >
                      View on GitHub →
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </details>

          {/* Missing Topics */}
          <details className="card overflow-hidden">
            <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
              <p className="text-slate-100 text-sm font-medium">
                Missing Topics / Tags
                {githubAudit.missingTopics.length > 0 && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/40">
                    {githubAudit.missingTopics.length}
                  </span>
                )}
              </p>
              <span className="text-slate-600 text-xs font-mono">toggle</span>
            </summary>
            {githubAudit.missingTopics.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">All repos have topics set.</p>
            ) : (
              <ul className="divide-y divide-[#2a2d3a]">
                {githubAudit.missingTopics.map((r, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <span className="font-mono text-xs text-slate-300">{r.repo}</span>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-cyan-400 transition-colors flex-shrink-0"
                    >
                      Edit on GitHub →
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </details>

          {/* Profile Consistency */}
          {githubAudit.profileConsistency.length > 0 && (
            <details className="card overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
                <p className="text-slate-100 text-sm font-medium">Profile Consistency</p>
                <span className="text-slate-600 text-xs font-mono">toggle</span>
              </summary>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2d3a]">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Field</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">GitHub</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">DB value</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {githubAudit.profileConsistency.map((f, i) => (
                      <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                        <td className="px-4 py-2.5 text-slate-300 font-medium text-xs capitalize">
                          {f.field}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[160px] truncate">
                          {f.githubValue ?? <span className="text-slate-600 italic">not set</span>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[160px] truncate hidden md:table-cell">
                          {f.dbValue ?? <span className="text-slate-600 italic">not set</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <ConsistencyBadge status={f.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Blog Suggester UI */}
      {blogSuggesterData && (
        <div className="space-y-4 mb-6">
          {/* Standalone suggestions */}
          {blogSuggesterData.suggestions.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a]">
                <p className="text-slate-100 text-sm font-medium">
                  Suggested Topics ({blogSuggesterData.suggestions.length})
                </p>
              </div>
              <div className="divide-y divide-[#2a2d3a]">
                {blogSuggesterData.suggestions.map((s, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-slate-100 text-sm font-medium">{s.title}</p>
                      <Link
                        href={`/admin/blog/new?title=${encodeURIComponent(s.title)}`}
                        className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors flex-shrink-0"
                      >
                        Draft →
                      </Link>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">{s.rationale}</p>
                    {s.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {s.tags.map((tag) => (
                          <span key={tag} className="tag text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Series */}
          {blogSuggesterData.series && blogSuggesterData.series.length > 0 && (
            <div className="space-y-3">
              <p className="text-slate-100 text-sm font-medium">Content Series</p>
              {blogSuggesterData.series.map((series, si) => (
                <div key={si} className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#2a2d3a] flex items-center justify-between gap-3">
                    <p className="text-slate-100 text-sm font-semibold">{series.seriesTitle}</p>
                    <form action={createSeriesDrafts}>
                      <input
                        type="hidden"
                        name="posts"
                        value={JSON.stringify(
                          series.posts.map((p) => ({ title: p.title, tags: p.tags }))
                        )}
                      />
                      <button
                        type="submit"
                        className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors flex-shrink-0"
                      >
                        Create {series.posts.length} drafts
                      </button>
                    </form>
                  </div>
                  <ol className="divide-y divide-[#2a2d3a]">
                    {series.posts.map((post, pi) => (
                      <li key={pi} className="px-4 py-2.5 flex items-start gap-3">
                        <span className="text-slate-600 text-xs font-mono w-5 flex-shrink-0 mt-0.5">
                          {pi + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-100 text-sm">{post.title}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{post.rationale}</p>
                          {post.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {post.tags.map((tag) => (
                                <span key={tag} className="tag text-xs">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brand Monitor UI */}
      {brandMonitorData && (
        <div className="space-y-4 mb-6">
          {brandMonitorData.githubDelta.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a]">
                <p className="text-slate-100 text-sm font-medium">GitHub Star / Fork Delta</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2d3a]">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Repo</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Stars</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Stars Delta</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Forks</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Forks Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brandMonitorData.githubDelta.map((r, i) => (
                      <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-300">{r.repo}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{r.stars}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">
                          {r.starDelta > 0 ? (
                            <span className="text-emerald-400">+{r.starDelta}</span>
                          ) : r.starDelta < 0 ? (
                            <span className="text-red-400">{r.starDelta}</span>
                          ) : (
                            <span className="text-slate-600">0</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs">{r.forks}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">
                          {r.forkDelta > 0 ? (
                            <span className="text-emerald-400">+{r.forkDelta}</span>
                          ) : r.forkDelta < 0 ? (
                            <span className="text-red-400">{r.forkDelta}</span>
                          ) : (
                            <span className="text-slate-600">0</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {brandMonitorData.googleAlerts.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a]">
                <p className="text-slate-100 text-sm font-medium">
                  Google Alerts ({brandMonitorData.googleAlerts.length})
                </p>
              </div>
              <ul className="divide-y divide-[#2a2d3a]">
                {brandMonitorData.googleAlerts.map((a, i) => (
                  <li key={i} className="flex items-start justify-between px-4 py-2.5 gap-3">
                    <div className="flex-1 min-w-0">
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-100 text-sm hover:text-cyan-400 transition-colors"
                      >
                        {a.title}
                      </a>
                      {a.pubDate && (
                        <p className="text-slate-600 text-xs font-mono mt-0.5">{a.pubDate}</p>
                      )}
                    </div>
                    {a.sentiment && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                          a.sentiment === "positive"
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : a.sentiment === "negative"
                              ? "text-red-400 bg-red-500/10 border-red-500/20"
                              : "text-slate-400 bg-slate-700/20 border-slate-600/40"
                        }`}
                      >
                        {a.sentiment}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#2a2d3a]">
              <p className="text-slate-100 text-sm font-medium">
                Dev.to Mentions ({brandMonitorData.devToMentions.length})
              </p>
            </div>
            {brandMonitorData.devToMentions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">No Dev.to mentions found.</p>
            ) : (
              <ul className="divide-y divide-[#2a2d3a]">
                {brandMonitorData.devToMentions.map((m, i) => (
                  <li key={i} className="px-4 py-2.5">
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-100 text-sm hover:text-cyan-400 transition-colors truncate block"
                    >
                      {m.title}
                    </a>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {m.author}
                      {m.publishedAt && (
                        <span className="ml-2 font-mono">
                          {new Date(m.publishedAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Platform Sync UI */}
      {platformSyncData && (
        <div className="space-y-4 mb-6">
          {/* Configured platforms chips */}
          <div className="flex flex-wrap gap-3">
            {platformSyncData.configuredPlatforms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {p}
              </span>
            ))}
            {platformSyncData.dbExperienceCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[#2a2d3a] text-slate-500">
                {platformSyncData.dbExperienceCount} experience entr{platformSyncData.dbExperienceCount !== 1 ? "ies" : "y"} in DB
              </span>
            )}
          </div>

          {/* PS-B: Profile consistency table */}
          {platformSyncData.profileConsistency.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a]">
                <p className="text-slate-100 text-sm font-medium">Profile Consistency</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2a2d3a]">
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Field</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">GitHub</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium hidden md:table-cell">DB value</th>
                      <th className="text-left px-4 py-2 text-slate-500 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformSyncData.profileConsistency.map((row: ProfileConsistencyRow, i: number) => (
                      <tr key={i} className="border-b border-[#2a2d3a] last:border-0">
                        <td className="px-4 py-2.5 text-slate-300 font-medium text-xs capitalize">
                          {row.field}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[160px] truncate">
                          {row.githubValue ?? <span className="text-slate-600 italic">not set</span>}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[160px] truncate hidden md:table-cell">
                          {row.dbValue ?? <span className="text-slate-600 italic">not set</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.status === "match" ? (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                              Match
                            </span>
                          ) : row.status === "mismatch" ? (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                              Mismatch
                            </span>
                          ) : row.status === "missing_github" ? (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-500">
                              Not on GitHub
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-500">
                              Missing in DB
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PS-A: LinkedIn cross-reference note */}
          <div className="card p-4 flex items-start gap-3">
            <div className="flex-1">
              <p className="text-slate-300 text-sm font-medium mb-1">LinkedIn Cross-Reference</p>
              <p className="text-slate-500 text-xs">
                {platformSyncData.dbExperienceCount} experience entr{platformSyncData.dbExperienceCount !== 1 ? "ies" : "y"} in DB.
                Run the{" "}
                <Link href="/admin" className="text-cyan-400 hover:underline">
                  LinkedIn CSV import
                </Link>{" "}
                in the admin panel to compare against your portfolio experience entries.
              </p>
            </div>
          </div>

          {/* PS-C: Twitter section — conditional */}
          {platformSyncData.twitter ? (
            <div className="card p-4">
              <p className="text-slate-300 text-sm font-medium mb-2">X / Twitter</p>
              <dl className="space-y-1 text-sm">
                <div className="flex gap-3">
                  <dt className="text-slate-500 w-24 flex-shrink-0">Followers</dt>
                  <dd className="text-slate-300">{platformSyncData.twitter.followerCount}</dd>
                </div>
                {platformSyncData.twitter.bio && (
                  <div className="flex gap-3">
                    <dt className="text-slate-500 w-24 flex-shrink-0">Bio</dt>
                    <dd className="text-slate-400 text-xs">{platformSyncData.twitter.bio}</dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="card p-4">
              <p className="text-slate-500 text-sm">
                X / Twitter: Not configured — set{" "}
                <code className="font-mono text-xs text-slate-400">TWITTER_BEARER_TOKEN</code> to enable.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Robotics Digest UI */}
      {roboticsDigestData && (
        <div className="space-y-4 mb-6">
          {/* Header chips */}
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
              {roboticsDigestData.newItemCount} new article{roboticsDigestData.newItemCount !== 1 ? "s" : ""}
            </span>
            {roboticsDigestData.seenCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-600/50 bg-slate-700/20 text-slate-400">
                {roboticsDigestData.seenCount} already seen
              </span>
            )}
          </div>

          {/* Digest — curated top 5 with "why" */}
          {roboticsDigestData.digest.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a] flex flex-wrap items-center gap-3">
                <p className="text-slate-100 text-sm font-medium">
                  Curated Digest ({roboticsDigestData.digest.length})
                </p>
                {roboticsDigestData.digestError && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                    ⚠ {roboticsDigestData.digestError}
                  </span>
                )}
              </div>
              <ol className="divide-y divide-[#2a2d3a]">
                {roboticsDigestData.digest.map((item: DigestItem, i: number) => (
                  <li key={i} className="px-4 py-3 flex items-start gap-3">
                    <span className="text-slate-600 text-xs font-mono w-5 flex-shrink-0 mt-0.5">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-100 text-sm font-medium hover:text-cyan-400 transition-colors"
                      >
                        {item.title}
                      </a>
                      <p className="text-slate-500 text-xs mt-0.5 italic">{item.why}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Raw items — collapsed full list */}
          {roboticsDigestData.rawItems.length > 0 && (
            <details className="card overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer select-none border-b border-[#2a2d3a]">
                <p className="text-slate-400 text-sm">
                  All new articles ({roboticsDigestData.rawItems.length})
                </p>
                <span className="text-slate-600 text-xs font-mono">toggle</span>
              </summary>
              <ul className="divide-y divide-[#2a2d3a]">
                {roboticsDigestData.rawItems.map((item, i) => (
                  <li key={i} className="flex items-center justify-between px-4 py-2.5 gap-3">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 text-xs hover:text-cyan-400 transition-colors truncate"
                    >
                      {item.title}
                    </a>
                    <span className="text-slate-600 text-xs font-mono flex-shrink-0">{item.source}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="card p-6 mb-4">
        <MarkdownRenderer content={report.summary} />
      </div>

      {/* Sources */}
      {report.sources.length > 0 && (
        <div className="card p-4 mb-4">
          <p className="text-slate-400 text-sm font-medium mb-3">
            Sources ({report.sources.length})
          </p>
          <ul className="space-y-1">
            {report.sources.map((src, i) => (
              <li key={i}>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-cyan-400 hover:underline break-all"
                >
                  {src}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw data (collapsible) */}
      {report.rawData && (
        <details className="card p-4">
          <summary className="text-slate-500 text-xs font-mono cursor-pointer select-none">
            Raw data
          </summary>
          <pre className="mt-3 text-xs text-slate-500 overflow-x-auto whitespace-pre-wrap font-mono">
            {JSON.stringify(report.rawData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
