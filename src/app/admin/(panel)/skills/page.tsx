import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import RunAgentButton from "@/components/admin/RunAgentButton";

export const metadata: Metadata = { title: "Skills" };

const CATEGORIES = ["LANGUAGE", "FRAMEWORK", "TOOL", "ROBOTICS", "EMBEDDED", "DATABASE", "OTHER"] as const;
const LEVELS = ["FAMILIAR", "PROFICIENT", "EXPERT"] as const;

const categoryLabels: Record<string, string> = {
  LANGUAGE: "Languages",
  FRAMEWORK: "Frameworks & Libraries",
  TOOL: "Tools & Infrastructure",
  ROBOTICS: "Robotics",
  EMBEDDED: "Embedded",
  DATABASE: "Databases",
  OTHER: "Other",
};

export default async function SkillsAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [skills, inferenceAgent] = await Promise.all([
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] }),
    prisma.agent.findUnique({ where: { id: "agent-skills-inference" } }),
  ]);

  const grouped = new Map<string, typeof skills>();
  for (const skill of skills) {
    const existing = grouped.get(skill.category) ?? [];
    existing.push(skill);
    grouped.set(skill.category, existing);
  }

  async function addSkill(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const level = (formData.get("level") as string) || null;
    if (!name || !category) return;
    await prisma.skill.create({
      data: { name, category: category as never, level: level as never, order: 0 },
    });
    revalidatePath("/admin/skills");
  }

  async function deleteSkill(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    await prisma.skill.delete({ where: { id } });
    revalidatePath("/admin/skills");
  }

  async function updateSkillLevel(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const level = (formData.get("level") as string) || null;
    if (!id) return;
    await prisma.skill.update({ where: { id }, data: { level: level as never } });
    revalidatePath("/admin/skills");
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Skills</h1>
          <p className="text-slate-500 text-sm font-mono mt-0.5">{skills.length} total</p>
        </div>
        {inferenceAgent && (
          <RunAgentButton
            agentId="agent-skills-inference"
            agentEnabled={inferenceAgent.enabled}
            agentStatus={inferenceAgent.status}
            label="Sync from GitHub"
            redirectOnSuccess={true}
          />
        )}
      </div>

      <div className="card p-4 mb-6">
        <p className="text-slate-400 text-sm font-medium mb-3">Add skill</p>
        <form action={addSkill} className="flex gap-2 flex-wrap">
          <input
            name="name"
            placeholder="Skill name"
            required
            className="flex-1 min-w-32 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
          <select
            name="category"
            required
            className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
          <select
            name="level"
            className="bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">No level</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0) + l.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary text-sm">
            Add
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const categorySkills = grouped.get(category) ?? [];
          if (categorySkills.length === 0) return null;
          return (
            <div key={category} className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-[#2a2d3a]">
                <p className="text-slate-400 text-sm font-medium">{categoryLabels[category]}</p>
              </div>
              <div className="divide-y divide-[#2a2d3a]">
                {categorySkills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between px-4 py-2.5 gap-2">
                    <span className="text-slate-100 text-sm flex-1">{skill.name}</span>
                    <form action={updateSkillLevel} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={skill.id} />
                      <select
                        name="level"
                        defaultValue={skill.level ?? ""}
                        className="bg-[#0f1117] border border-[#2a2d3a] rounded px-1.5 py-0.5 text-xs text-slate-400 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">No level</option>
                        {LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {l.charAt(0) + l.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="text-xs text-cyan-400 hover:text-cyan-300 px-1" title="Save level">
                        ✓
                      </button>
                    </form>
                    <form action={deleteSkill}>
                      <input type="hidden" name="id" value={skill.id} />
                      <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
