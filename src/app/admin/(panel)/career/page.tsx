import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CareerEvaluateForm from "@/components/admin/CareerEvaluateForm";

export const metadata: Metadata = { title: "Career | Admin" };

interface PipelineJob {
  id?: string;
  url?: string;
  status?: string;
  pdfPath?: string;
  createdAt?: string;
}

interface PipelineResponse {
  jobs?: PipelineJob[];
}

async function fetchPipeline(): Promise<PipelineJob[] | null> {
  const internalUrl = process.env.CAREER_OPS_INTERNAL_URL;
  const secret = process.env.CAREER_OPS_INTERNAL_SECRET;

  if (!internalUrl) return null;

  try {
    const res = await fetch(`${internalUrl}/pipeline`, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PipelineResponse;
    return data.jobs ?? [];
  } catch {
    return null;
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  running: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  done: "text-green-400 bg-green-500/10 border-green-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
};

function statusColor(status?: string): string {
  if (!status) return STATUS_COLORS["pending"] ?? "";
  return STATUS_COLORS[status] ?? STATUS_COLORS["pending"] ?? "";
}

export default async function CareerAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const jobs = await fetchPipeline();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Career</h1>
        <p className="text-slate-500 text-sm font-mono mt-0.5">
          Job evaluation and CV management via career-ops
        </p>
      </div>

      {/* Sections 1 & 2 — client-rendered interactive parts */}
      <CareerEvaluateForm />

      {/* Section 3 — Pipeline (server-rendered) */}
      <div className="card p-4">
        <h2 className="text-slate-100 font-semibold mb-1">Evaluation Pipeline</h2>
        <p className="text-slate-500 text-xs font-mono mb-4">
          Jobs evaluated by career-ops
        </p>

        {jobs === null ? (
          <p className="text-slate-500 font-mono text-sm">
            Pipeline fetch failed — <span className="text-slate-400">career-ops</span> may be unreachable.
          </p>
        ) : jobs.length === 0 ? (
          <p className="text-slate-500 font-mono text-sm">No evaluations yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d3a]">
                  <th className="text-left text-slate-500 font-mono text-xs pb-2 pr-4 font-normal">
                    URL
                  </th>
                  <th className="text-left text-slate-500 font-mono text-xs pb-2 pr-4 font-normal">
                    Status
                  </th>
                  <th className="text-left text-slate-500 font-mono text-xs pb-2 font-normal">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3a]">
                {jobs.map((job, idx) => (
                  <tr key={job.id ?? idx}>
                    <td className="py-2 pr-4 max-w-xs">
                      {job.url ? (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-300 hover:text-cyan-400 font-mono text-xs truncate block max-w-[280px] transition-colors"
                          title={job.url}
                        >
                          {job.url}
                        </a>
                      ) : (
                        <span className="text-slate-600 font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded border ${statusColor(job.status)}`}
                      >
                        {job.status ?? "unknown"}
                      </span>
                    </td>
                    <td className="py-2">
                      {job.pdfPath && job.pdfPath.startsWith("http") ? (
                        <a
                          href={job.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                        >
                          PDF
                        </a>
                      ) : (
                        <span className="text-slate-600 font-mono text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
