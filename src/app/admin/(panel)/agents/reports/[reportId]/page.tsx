import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { SkillCategory, SkillLevel } from "@prisma/client";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface SkillAddSuggestion {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  evidence: string;
}

interface SkillUpgradeSuggestion {
  name: string;
  currentLevel: string;
  suggestedLevel: string;
  evidence: string;
}

interface SkillStaleSuggestion {
  name: string;
  reason: string;
}

interface SkillsDiffRawData {
  type: "SKILLS_DIFF";
  add: SkillAddSuggestion[];
  upgrade: SkillUpgradeSuggestion[];
  stale: SkillStaleSuggestion[];
}

interface ProjectSuggestion {
  title: string;
  slug: string;
  summary: string;
  content: string;
  type: "SOFTWARE" | "ROBOTICS" | "HARDWARE" | "RESEARCH";
  techTags: string[];
  githubUrl: string;
}

interface ProjectSuggestionsRawData {
  type: "PROJECT_SUGGESTIONS";
  suggestions: ProjectSuggestion[];
  existingCount: number;
}

const typeColors: Record<string, string> = {
  ROBOTICS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  SOFTWARE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  HARDWARE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  RESEARCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default async function ReportDetailPage({
  params,
}: {
  params: { reportId: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [report, currentSkills] = await Promise.all([
    prisma.agentReport.findUnique({
      where: { id: params.reportId },
      include: { agent: true },
    }),
    prisma.skill.findMany({ select: { name: true } }),
  ]);
  if (!report) notFound();

  const appliedSkillNames = new Set(currentSkills.map((s) => s.name.toLowerCase()));

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

  async function createProjectDraft(formData: FormData) {
    "use server";
    const suggestionRaw = formData.get("suggestion") as string;
    const suggestion = JSON.parse(suggestionRaw) as ProjectSuggestion;
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
  }

  const rawData = report.rawData as Record<string, unknown> | null;
  const rawDataType = rawData && typeof rawData === "object" ? rawData.type : null;

  const isSkillsDiff =
    report.agent.type === "SKILLS_INFERENCE" && rawDataType === "SKILLS_DIFF";

  const isProjectSuggestions =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_SUGGESTIONS";

  const skillsDiff = isSkillsDiff ? (rawData as unknown as SkillsDiffRawData) : null;
  const projectSuggestions = isProjectSuggestions
    ? (rawData as unknown as ProjectSuggestionsRawData)
    : null;

  return (
    <div className="max-w-4xl">
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
              <div className="px-4 py-3 border-b border-[#2a2d3a]">
                <p className="text-slate-100 text-sm font-medium">
                  Skills to Add ({skillsDiff.add.length})
                </p>
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
                        <td className="px-4 py-2.5 text-slate-100 font-medium">{s.name}</td>
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
                {skillsDiff.stale.map((s, i) => (
                  <li key={i} className="px-4 py-2.5 flex items-start gap-3">
                    <span className="text-slate-100 text-sm font-medium min-w-32">{s.name}</span>
                    <span className="text-slate-500 text-xs">{s.reason}</span>
                  </li>
                ))}
              </ul>
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
            {projectSuggestions.suggestions.map((s, i) => (
              <div key={i} className="card p-4 flex flex-col gap-3">
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
                  <form action={createProjectDraft}>
                    <input type="hidden" name="suggestion" value={JSON.stringify(s)} />
                    <button
                      type="submit"
                      className="text-xs py-1 px-2.5 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-colors flex-shrink-0"
                    >
                      Create as Draft
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
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
