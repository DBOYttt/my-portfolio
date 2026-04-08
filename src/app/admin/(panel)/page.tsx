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
      <div>
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
    </div>
  );
}
