import type { Metadata } from "next";
import { existsSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RunAgentButton from "@/components/admin/RunAgentButton";
import CvEditor from "@/components/admin/CvEditor";
import CvTargetForm from "@/components/admin/CvTargetForm";
import type { CvContent } from "@/lib/cv-template";

export const metadata: Metadata = {
  title: "CV | Admin",
};

export default async function CvAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const user = await prisma.user.findFirst({
    select: { cvContent: true, cvGeneratedAt: true, cvSource: true },
  });

  const agent = await prisma.agent.findUnique({
    where: { id: "agent-cv-generator" },
  });

  const cvExists = existsSync(path.join(process.cwd(), "public", "cv.pdf"));

  const cvContent = (user?.cvContent ?? null) as CvContent | null;
  const cvGeneratedAt = user?.cvGeneratedAt ?? null;
  const cvSource = user?.cvSource ?? "manual";

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Curriculum Vitae</h1>
        <p className="text-slate-500 text-sm font-mono mt-0.5">
          AI-generated from your DB profile data
        </p>
      </div>

      {/* Status & actions */}
      <div className="card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          {cvGeneratedAt ? (
            <p className="text-slate-400 text-sm">
              Last generated:{" "}
              <span className="text-slate-200">
                {cvGeneratedAt.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="mx-2 text-slate-600">•</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded border ${
                  cvSource === "generated"
                    ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                    : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                }`}
              >
                {cvSource === "generated" ? "AI-generated" : "Manual upload"}
              </span>
            </p>
          ) : (
            <p className="text-slate-500 text-sm">No CV generated yet.</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {cvExists && (
            <a
              href="/cv.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm py-1.5 px-3"
            >
              Open PDF
            </a>
          )}
          <RunAgentButton
            agentId="agent-cv-generator"
            agentEnabled={agent?.enabled ?? true}
            agentStatus={agent?.status ?? "idle"}
          />
        </div>
      </div>

      {/* CV Editor */}
      <CvEditor initialContent={cvContent} />

      {/* Targeted CV generation */}
      <div className="mt-6">
        <CvTargetForm />
      </div>
    </div>
  );
}
