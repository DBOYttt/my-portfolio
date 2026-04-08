import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ToolsAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const tools = await prisma.toolShortcut.findMany({ orderBy: { order: "asc" } });

  async function addTool(formData: FormData) {
    "use server";
    const name = formData.get("name") as string;
    const url = formData.get("url") as string;
    const description = formData.get("description") as string;
    const icon = formData.get("icon") as string;
    const openInNewTab = formData.get("openInNewTab") !== "false";
    if (!name || !url) return;
    await prisma.toolShortcut.create({
      data: {
        name,
        url,
        description: description || null,
        icon: icon || null,
        openInNewTab,
        order: tools.length,
      },
    });
    revalidatePath("/admin/tools");
  }

  async function deleteTool(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    await prisma.toolShortcut.delete({ where: { id } });
    revalidatePath("/admin/tools");
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Tool shortcuts</h1>
        <p className="text-slate-500 text-sm font-mono mt-0.5">
          Quick links to your dev tools
        </p>
      </div>

      {/* Tool grid */}
      {tools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {tools.map((tool) => (
            <div key={tool.id} className="card p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {tool.icon && (
                    <span className="text-lg leading-none">{tool.icon}</span>
                  )}
                  <a
                    href={tool.url}
                    target={tool.openInNewTab ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="text-slate-100 font-medium text-sm hover:text-cyan-400 transition-colors"
                  >
                    {tool.name}
                  </a>
                </div>
                {tool.description && (
                  <p className="text-slate-500 text-xs">{tool.description}</p>
                )}
                <p className="font-mono text-xs text-slate-600 mt-1 truncate">
                  {tool.url}
                </p>
              </div>
              <form action={deleteTool} className="ml-3 flex-shrink-0">
                <input type="hidden" name="id" value={tool.id} />
                <button
                  type="submit"
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Add tool form */}
      <div className="card p-4">
        <p className="text-slate-400 text-sm font-medium mb-4">
          Add tool shortcut
        </p>
        <form action={addTool} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Name *
              </label>
              <input
                name="name"
                required
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                URL *
              </label>
              <input
                name="url"
                type="url"
                required
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Description
              </label>
              <input
                name="description"
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Icon (emoji)
              </label>
              <input
                name="icon"
                maxLength={4}
                className="w-full bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="openInNewTab"
              id="openInNewTab"
              defaultChecked
              className="w-4 h-4 accent-cyan-500"
            />
            <label
              htmlFor="openInNewTab"
              className="text-sm text-slate-400 cursor-pointer"
            >
              Open in new tab
            </label>
          </div>
          <button type="submit" className="btn-primary text-sm">
            Add tool
          </button>
        </form>
      </div>
    </div>
  );
}
