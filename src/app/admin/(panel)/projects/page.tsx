import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RunAgentButton from "@/components/admin/RunAgentButton";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

export const metadata: Metadata = { title: "Projects" };

const typeColors: Record<string, string> = {
  ROBOTICS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  SOFTWARE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  HARDWARE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  RESEARCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default async function ProjectsAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [projects, importerAgent] = await Promise.all([
    prisma.project.findMany({ orderBy: { order: "asc" } }),
    prisma.agent.findUnique({ where: { id: "agent-github-project-importer" } }),
  ]);

  async function deleteProject(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    await prisma.project.delete({ where: { id } });
    revalidatePath("/admin/projects");
    revalidatePath("/projects");
    revalidatePath("/");
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
          <p className="text-slate-500 text-sm font-mono mt-0.5">
            {projects.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {importerAgent && (
            <RunAgentButton
              agentId="agent-github-project-importer"
              agentEnabled={importerAgent.enabled}
              agentStatus={importerAgent.status}
              label="Import from GitHub"
              redirectOnSuccess={true}
            />
          )}
          <Link href="/admin/projects/new" className="btn-primary">
            New project
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500 font-mono text-sm">No projects yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2d3a]">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium hidden md:table-cell">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium hidden md:table-cell">
                  Featured
                </th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#1a1d27]/50"
                >
                  <td className="px-4 py-3 text-slate-100 font-medium max-w-xs truncate">
                    {project.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${typeColors[project.type] ?? typeColors.SOFTWARE}`}
                    >
                      {project.type.charAt(0) + project.type.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {project.publishedAt ? (
                      <span className="text-xs px-2 py-0.5 rounded border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                        Published
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded border text-slate-400 bg-slate-500/10 border-slate-500/20">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono hidden md:table-cell">
                    {project.order}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {project.featured && (
                      <span className="text-xs text-cyan-400">&#9733; featured</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/projects/${project.id}`}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        Edit
                      </Link>
                      <ConfirmDeleteButton action={deleteProject} id={project.id} label="project" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
