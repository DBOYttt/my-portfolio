import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

export default async function ReportDetailPage({
  params,
}: {
  params: { reportId: string };
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const report = await prisma.agentReport.findUnique({
    where: { id: params.reportId },
    include: { agent: true },
  });
  if (!report) notFound();

  async function markRead() {
    "use server";
    await prisma.agentReport.update({
      where: { id: params.reportId },
      data: { readAt: new Date() },
    });
    revalidatePath(`/admin/agents/reports/${params.reportId}`);
  }

  return (
    <div className="max-w-3xl">
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
