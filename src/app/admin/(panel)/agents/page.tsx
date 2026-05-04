import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RunAgentButton from "@/components/admin/RunAgentButton";

export const metadata: Metadata = { title: "Agents" };

export default async function AgentsAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const agents = await prisma.agent.findMany({
    include: {
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const unreadCounts = await Promise.all(
    agents.map((a) =>
      prisma.agentReport.count({ where: { agentId: a.id, readAt: null } })
    )
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">AI Agents</h1>
        <p className="text-slate-500 text-sm font-mono mt-0.5">
          Research assistants — read-only
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500 font-mono text-sm">
            No agents found. Run an agent script to populate this page.
          </p>
          <p className="text-slate-600 text-xs mt-2 font-mono">
            npx tsx agents/github-summarizer.ts
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent, idx) => {
            const latestReport = agent.reports[0];
            const unread = unreadCounts[idx];
            return (
              <div key={agent.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-slate-100 font-medium">{agent.name}</p>
                      {unread > 0 && (
                        <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                          {unread} new
                        </span>
                      )}
                      {agent.status === "running" && (
                        <span className="text-xs px-1.5 py-0.5 rounded border text-yellow-400 bg-yellow-500/10 border-yellow-500/20">
                          running
                        </span>
                      )}
                      {agent.status === "error" && (
                        <span className="text-xs px-1.5 py-0.5 rounded border text-red-400 bg-red-500/10 border-red-500/20">
                          error
                        </span>
                      )}
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border ${
                          agent.enabled
                            ? "text-green-400 bg-green-500/10 border-green-500/20"
                            : "text-slate-500 bg-slate-500/10 border-slate-500/20"
                        }`}
                      >
                        {agent.enabled ? "enabled" : "disabled"}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs mb-2">
                      {agent.description}
                    </p>
                    {agent.status === "error" && agent.lastError && (
                      <p className="text-red-400 text-xs font-mono mb-2 truncate">
                        {agent.lastError}
                      </p>
                    )}
                    {latestReport ? (
                      <p className="text-slate-400 text-sm truncate">
                        Latest:{" "}
                        <span className="text-slate-300">
                          {latestReport.title}
                        </span>
                        <span className="text-slate-600 ml-2 font-mono text-xs">
                          {latestReport.createdAt.toLocaleDateString()}
                        </span>
                      </p>
                    ) : (
                      <p className="text-slate-600 text-xs font-mono">
                        No reports yet
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <RunAgentButton
                      agentId={agent.id}
                      agentEnabled={agent.enabled}
                      agentStatus={agent.status}
                    />
                    <Link
                      href={`/admin/agents/${agent.id}`}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      View reports
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
