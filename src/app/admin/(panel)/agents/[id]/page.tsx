import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import RunAgentButton from "@/components/admin/RunAgentButton";

export default async function AgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
    include: {
      reports: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!agent) notFound();

  async function markRead(formData: FormData) {
    "use server";
    const reportId = formData.get("reportId") as string;
    if (!reportId) return;
    await prisma.agentReport.update({
      where: { id: reportId },
      data: { readAt: new Date() },
    });
    revalidatePath(`/admin/agents/${params.id}`);
  }

  async function deleteReport(formData: FormData) {
    "use server";
    const reportId = formData.get("reportId") as string;
    if (!reportId) return;
    await prisma.agentReport.delete({ where: { id: reportId } });
    revalidatePath(`/admin/agents/${params.id}`);
  }

  async function deleteAllReports() {
    "use server";
    await prisma.agentReport.deleteMany({ where: { agentId: params.id } });
    revalidatePath(`/admin/agents/${params.id}`);
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/agents"
            className="font-mono text-xs text-slate-500 hover:text-cyan-400 transition-colors"
          >
            ← All agents
          </Link>
          <RunAgentButton
            agentId={agent.id}
            agentEnabled={agent.enabled}
            agentStatus={agent.status}
          />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mt-2">{agent.name}</h1>
        <div className="flex items-center gap-3 mt-0.5">
          <p className="text-slate-500 text-sm font-mono">
            {agent.reports.length} report{agent.reports.length !== 1 ? "s" : ""}
          </p>
          {agent.reports.length > 0 && (
            <form action={deleteAllReports}>
              <button
                type="submit"
                className="text-xs font-mono text-red-500 hover:text-red-400 transition-colors"
              >
                Delete all
              </button>
            </form>
          )}
        </div>
      </div>

      {agent.reports.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500 font-mono text-sm">No reports yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agent.reports.map((report) => (
            <div
              key={report.id}
              className={`card p-4 ${!report.readAt ? "border-cyan-500/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!report.readAt && (
                      <span className="text-xs font-mono text-cyan-400">
                        &#9679; unread
                      </span>
                    )}
                    <span className="text-slate-600 font-mono text-xs">
                      {report.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <Link
                    href={`/admin/agents/reports/${report.id}`}
                    className="text-slate-100 font-medium hover:text-cyan-400 transition-colors"
                  >
                    {report.title}
                  </Link>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">
                    {report.summary.slice(0, 150)}
                  </p>
                  {report.sources.length > 0 && (
                    <p className="text-slate-600 text-xs font-mono mt-1">
                      {report.sources.length} sources
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!report.readAt && (
                    <form action={markRead}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <button type="submit" className="btn-secondary text-xs py-1 px-2">
                        Mark read
                      </button>
                    </form>
                  )}
                  <form action={deleteReport}>
                    <input type="hidden" name="reportId" value={report.id} />
                    <button
                      type="submit"
                      className="text-xs font-mono text-slate-600 hover:text-red-400 transition-colors px-1"
                      title="Delete report"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
