import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { ErrorParamCleaner } from "./ErrorParamCleaner";
import {
  isRecord,
  type SkillsDiffRawData,
  type ProjectSuggestionsRawData,
  type ProjectCreatedRawData,
  type BrandMonitorRawData,
  type BlogSuggesterRawData,
} from "@/types/agent-reports";
import type { GitHubAuditRawData } from "@/lib/agents/github-summarizer";
import type { ProjectSyncDiffRawData } from "@/lib/agents/github-project-importer";
import type { RoboticsDigestRawData } from "@/lib/agents/robotics-news";
import type { PlatformSyncRawData } from "@/lib/agents/platform-sync";
import * as actions from "./actions";
import ReportHeader from "@/components/admin/reports/ReportHeader";
import SkillsDiffReport from "@/components/admin/reports/SkillsDiffReport";
import ProjectSuggestionsReport from "@/components/admin/reports/ProjectSuggestionsReport";
import ProjectCreatedReport from "@/components/admin/reports/ProjectCreatedReport";
import ProjectSyncDiffReport from "@/components/admin/reports/ProjectSyncDiffReport";
import GitHubAuditReport from "@/components/admin/reports/GitHubAuditReport";
import BrandMonitorReport from "@/components/admin/reports/BrandMonitorReport";
import BlogSuggesterReport from "@/components/admin/reports/BlogSuggesterReport";
import RoboticsDigestReport from "@/components/admin/reports/RoboticsDigestReport";
import PlatformSyncReport from "@/components/admin/reports/PlatformSyncReport";

export const metadata: Metadata = { title: "Report" };

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: { reportId: string };
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { reportId } = params;

  const [report, currentSkills, currentProjects] = await Promise.all([
    prisma.agentReport.findUnique({
      where: { id: reportId },
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

  const rawData = isRecord(report.rawData) ? report.rawData : null;
  const rawDataType = rawData ? rawData.type : null;

  const skillsDiff =
    report.agent.type === "SKILLS_INFERENCE" && rawDataType === "SKILLS_DIFF"
      ? (rawData as unknown as SkillsDiffRawData)
      : null;

  const projectSuggestions =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_SUGGESTIONS"
      ? (rawData as unknown as ProjectSuggestionsRawData)
      : null;

  const projectCreated =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_CREATED"
      ? (rawData as unknown as ProjectCreatedRawData)
      : null;

  const projectSyncDiff =
    report.agent.type === "GITHUB_PROJECT_IMPORTER" && rawDataType === "PROJECT_SYNC_DIFF"
      ? (rawData as unknown as ProjectSyncDiffRawData)
      : null;

  const githubAudit =
    report.agent.type === "GITHUB_SUMMARIZER" && rawDataType === "GITHUB_AUDIT"
      ? (rawData as unknown as GitHubAuditRawData)
      : null;

  const brandMonitorData =
    report.agent.type === "BRAND_MONITOR" &&
    rawData !== null &&
    ("githubDelta" in rawData || "googleAlerts" in rawData || "devToMentions" in rawData)
      ? (rawData as unknown as BrandMonitorRawData)
      : null;

  const blogSuggesterData =
    report.agent.type === "BLOG_SUGGESTER" && rawData !== null && Array.isArray(rawData.suggestions)
      ? (rawData as unknown as BlogSuggesterRawData)
      : null;

  const roboticsDigestData =
    report.agent.type === "ROBOTICS_NEWS" && rawDataType === "ROBOTICS_DIGEST"
      ? (rawData as unknown as RoboticsDigestRawData)
      : null;

  const platformSyncData =
    report.agent.type === "PLATFORM_SYNC" && rawData !== null && "configuredPlatforms" in rawData
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

      <ReportHeader report={report} markRead={actions.markRead.bind(null, reportId)} />

      {skillsDiff && (
        <SkillsDiffReport
          data={skillsDiff}
          appliedSkillNames={appliedSkillNames}
          skillIdByName={skillIdByName}
          reportId={reportId}
          applyAdd={actions.applySkillAdd.bind(null, reportId)}
          applyAllAdditions={actions.applyAllSkillAdditions.bind(null, reportId)}
          applyUpgrade={actions.applySkillUpgrade.bind(null, reportId)}
          dismissStale={actions.dismissStaleSkill.bind(null, reportId)}
        />
      )}

      {projectSyncDiff && (
        <ProjectSyncDiffReport
          data={projectSyncDiff}
          applyUpdate={actions.applyProjectSyncUpdate.bind(null, reportId)}
        />
      )}

      {projectSuggestions && (
        <ProjectSuggestionsReport
          data={projectSuggestions}
          existingProjectSlugs={existingProjectSlugs}
          existingProjectGithubUrls={existingProjectGithubUrls}
          createDraft={actions.createProjectDraft.bind(null, reportId)}
        />
      )}

      {projectCreated && <ProjectCreatedReport data={projectCreated} />}

      {githubAudit && <GitHubAuditReport data={githubAudit} />}

      {blogSuggesterData && (
        <BlogSuggesterReport
          data={blogSuggesterData}
          createSeriesDrafts={actions.createSeriesDrafts.bind(null, reportId)}
        />
      )}

      {brandMonitorData && <BrandMonitorReport data={brandMonitorData} />}

      {platformSyncData && <PlatformSyncReport data={platformSyncData} />}

      {roboticsDigestData && <RoboticsDigestReport data={roboticsDigestData} />}

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
