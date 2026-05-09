import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import ConfirmDeleteButton from "@/components/admin/ConfirmDeleteButton";

export const metadata: Metadata = { title: "Experience" };

const WORK_TYPES = ["FULLTIME", "PARTTIME", "CONTRACT", "INTERNSHIP", "VOLUNTEER"] as const;
const typeLabels: Record<string, string> = {
  FULLTIME: "Full-time",
  PARTTIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  VOLUNTEER: "Volunteer",
};

export default async function ExperienceAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const items = await prisma.experience.findMany({ orderBy: { order: "asc" } });

  async function addExperience(formData: FormData) {
    "use server";
    const company = formData.get("company") as string;
    const role = formData.get("role") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const current = formData.get("current") === "on";
    const type = (formData.get("type") as string) || "FULLTIME";
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;

    if (!company || !role || !startDate) return;

    await prisma.experience.create({
      data: {
        company,
        role,
        description: description || "",
        startDate: new Date(startDate),
        endDate: endDate && !current ? new Date(endDate) : null,
        current,
        location: location || null,
        type: type as never,
        order: items.length,
      },
    });
    revalidatePath("/admin/experience");
  }

  async function deleteExperience(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    await prisma.experience.delete({ where: { id } });
    revalidatePath("/admin/experience");
  }

  async function updateExperience(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const company = formData.get("company") as string;
    const role = formData.get("role") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const current = formData.get("current") === "on";
    const type = (formData.get("type") as string) || "FULLTIME";
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;

    if (!id || !company || !role || !startDate) return;

    await prisma.experience.update({
      where: { id },
      data: {
        company,
        role,
        description: description || "",
        startDate: new Date(startDate),
        endDate: endDate && !current ? new Date(endDate) : null,
        current,
        location: location || null,
        type: type as never,
      },
    });
    revalidatePath("/admin/experience");
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Experience</h1>
        <p className="text-slate-500 text-sm font-mono mt-0.5">{items.length} entries</p>
      </div>

      {items.length > 0 && (
        <div className="space-y-3 mb-6">
          {items.map((item) => {
            const startVal = item.startDate.toISOString().slice(0, 10);
            const endVal = item.endDate ? item.endDate.toISOString().slice(0, 10) : "";
            return (
              <div key={item.id} className="card overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-slate-100 font-medium">{item.role}</p>
                      <p className="text-slate-400 text-sm">{item.company}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">
                          {item.startDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                          {" — "}
                          {item.current
                            ? "Present"
                            : item.endDate?.toLocaleDateString("en-GB", { month: "short", year: "numeric" }) ?? ""}
                        </span>
                        <span className="tag text-xs">{typeLabels[item.type]}</span>
                      </div>
                      {item.description && (
                        <p className="text-slate-500 text-xs mt-1.5 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <ConfirmDeleteButton action={deleteExperience} id={item.id} label="experience entry" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-[#2a2d3a] px-4 py-3">
                  <p className="text-slate-500 text-xs font-medium mb-3">Edit</p>
                  <form action={updateExperience} className="space-y-3">
                    <input type="hidden" name="id" value={item.id} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Company *</label>
                        <input
                          name="company"
                          required
                          defaultValue={item.company}
                          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Role *</label>
                        <input
                          name="role"
                          required
                          defaultValue={item.role}
                          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Description</label>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={item.description ?? ""}
                        className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Start date *</label>
                        <input
                          name="startDate"
                          type="date"
                          required
                          defaultValue={startVal}
                          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">End date</label>
                        <input
                          name="endDate"
                          type="date"
                          defaultValue={endVal}
                          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            name="current"
                            defaultChecked={item.current}
                            className="w-4 h-4 accent-cyan-500"
                          />
                          Current
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Type</label>
                        <select
                          name="type"
                          defaultValue={item.type}
                          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        >
                          {WORK_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {typeLabels[t]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Location</label>
                        <input
                          name="location"
                          defaultValue={item.location ?? ""}
                          className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="pt-1">
                      <button type="submit" className="btn-primary text-sm">
                        Save changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card p-4">
        <p className="text-slate-400 text-sm font-medium mb-4">Add experience</p>
        <form action={addExperience} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Company *</label>
              <input
                name="company"
                required
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Role *</label>
              <input
                name="role"
                required
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Description</label>
            <textarea
              name="description"
              rows={2}
              className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start date *</label>
              <input
                name="startDate"
                type="date"
                required
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End date</label>
              <input
                name="endDate"
                type="date"
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="checkbox" name="current" className="w-4 h-4 accent-cyan-500" />
                Current
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select
                name="type"
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                {WORK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {typeLabels[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Location</label>
              <input
                name="location"
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="pt-1">
            <button type="submit" className="btn-primary text-sm">
              Add entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
