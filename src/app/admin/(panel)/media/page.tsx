import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import MediaUploader from "@/components/admin/MediaUploader";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function MediaAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const assets = await prisma.mediaAsset.findMany({
    orderBy: { uploadedAt: "desc" },
  });

  async function deleteAsset(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const url = formData.get("url") as string;
    if (!id) return;

    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    const filePath = join(process.cwd(), "public", url);
    await unlink(filePath).catch(() => {});

    const { prisma: db } = await import("@/lib/prisma");
    await db.mediaAsset.delete({ where: { id } });
    revalidatePath("/admin/media");
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Media library</h1>
          <p className="text-slate-500 text-sm font-mono mt-0.5">
            {assets.length} {assets.length === 1 ? "file" : "files"}
          </p>
        </div>
      </div>

      <MediaUploader />

      {assets.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500 font-mono text-sm">
            No files uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {assets.map((asset) => (
            <div key={asset.id} className="card overflow-hidden group">
              <div className="aspect-square bg-[#0f1117] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-slate-400 text-xs font-mono truncate mb-1">
                  {asset.filename}
                </p>
                <p className="text-slate-600 text-xs font-mono mb-2">
                  {formatBytes(asset.sizeBytes)}
                </p>
                <div className="flex gap-1">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs py-1 px-1.5 border border-[#2a2d3a] text-slate-400 hover:text-slate-100 hover:border-slate-500 rounded transition-colors"
                  >
                    Open
                  </a>
                  <form action={deleteAsset}>
                    <input type="hidden" name="id" value={asset.id} />
                    <input type="hidden" name="url" value={asset.url} />
                    <button
                      type="submit"
                      className="text-xs py-1 px-1.5 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                    >
                      Del
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
