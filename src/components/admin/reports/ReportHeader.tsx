import Link from "next/link";
import type { AgentReport, Agent } from "@prisma/client";

interface Props {
  report: AgentReport & { agent: Agent };
  markRead: () => Promise<void>;
}

export default function ReportHeader({ report, markRead }: Props) {
  return (
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
  );
}
