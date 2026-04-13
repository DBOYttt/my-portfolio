import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [postCount, publishedCount, projectCount, skillCount, unreadReports] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.project.count(),
      prisma.skill.count(),
      prisma.agentReport.count({ where: { readAt: null } }),
    ]);

  const stats = [
    { label: "Total Posts", value: postCount },
    { label: "Published", value: publishedCount },
    { label: "Projects", value: projectCount },
    { label: "Skills", value: skillCount },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Dashboard</h1>
        <p className="text-slate-500 text-sm font-mono">Overview of your portfolio content</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value }) => (
          <div key={label} className="card p-4">
            <p className="text-slate-500 text-xs font-mono mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Agent insights */}
      {unreadReports > 0 && (
        <div className="card p-4 mb-8 border-cyan-500/20 bg-cyan-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-100 text-sm font-medium">
                {unreadReports} unread agent report{unreadReports !== 1 ? "s" : ""}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">Your AI agents have new activity</p>
            </div>
            <Link href="/admin/agents" className="btn-secondary text-xs py-1.5 px-3">
              View reports
            </Link>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mb-8">
        <p className="text-slate-500 text-xs font-mono mb-3">Quick actions</p>
        <div className="flex gap-3">
          <Link href="/admin/blog/new" className="btn-primary text-sm">
            New post
          </Link>
          <Link href="/admin/projects/new" className="btn-secondary text-sm">
            New project
          </Link>
        </div>
      </div>

      {/* Platform Connections card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Platform Connections</h2>
        <div className="space-y-3">
          {/* GitHub */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  process.env.GITHUB_USERNAME ? "bg-green-400" : "bg-yellow-400"
                }`}
              />
              <span className="text-sm text-slate-300">GitHub</span>
              {process.env.GITHUB_USERNAME && (
                <span className="text-xs text-slate-500 font-mono">
                  @{process.env.GITHUB_USERNAME}
                </span>
              )}
            </div>
            {!process.env.GITHUB_USERNAME && (
              <span className="text-xs text-yellow-400 font-mono">Add GITHUB_USERNAME</span>
            )}
          </div>
          {/* X / Twitter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  process.env.TWITTER_BEARER_TOKEN ? "bg-green-400" : "bg-slate-600"
                }`}
              />
              <span className="text-sm text-slate-300">X / Twitter</span>
              {process.env.TWITTER_USERNAME && (
                <span className="text-xs text-slate-500 font-mono">
                  @{process.env.TWITTER_USERNAME}
                </span>
              )}
            </div>
            {!process.env.TWITTER_BEARER_TOKEN && (
              <span className="text-xs text-slate-500 font-mono">Add TWITTER_BEARER_TOKEN</span>
            )}
          </div>
          {/* LinkedIn */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-600" />
              <span className="text-sm text-slate-300">LinkedIn</span>
            </div>
            <a
              href="https://www.linkedin.com/psettings/member-data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono"
            >
              Export data →
            </a>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[#2a2d3a]">
          <Link href="/admin/agents" className="btn-secondary text-xs py-1.5 px-3">
            View agents →
          </Link>
        </div>
      </div>
    </div>
  );
}
