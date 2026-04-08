import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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

  const skills = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });

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

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Skills</h1>
        <p className="text-slate-500 text-sm font-mono mt-0.5">{skills.length} total</p>
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
                  <div key={skill.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-100 text-sm">{skill.name}</span>
                      {skill.level && (
                        <span className="text-xs text-slate-500 font-mono">
                          {skill.level.toLowerCase()}
                        </span>
                      )}
                    </div>
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
