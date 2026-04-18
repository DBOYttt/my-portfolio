import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const statusColors: Record<string, string> = {
  DRAFT: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  PUBLISHED: "text-green-400 bg-green-500/10 border-green-500/20",
  SCHEDULED: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export default async function BlogAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: { tags: { select: { name: true } } },
  });

  async function deletePost(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (!id) return;
    await prisma.post.delete({ where: { id } });
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Blog posts</h1>
          <p className="text-slate-500 text-sm font-mono mt-0.5">
            {posts.length} total
          </p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary">
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-slate-500 font-mono text-sm">No posts yet.</p>
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
                  Status
                </th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium hidden md:table-cell">
                  Tags
                </th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium hidden md:table-cell">
                  Date
                </th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[#2a2d3a] last:border-0 hover:bg-[#1a1d27]/50"
                >
                  <td className="px-4 py-3 text-slate-100 font-medium max-w-xs truncate">
                    {post.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${statusColors[post.status] ?? statusColors.DRAFT}`}
                    >
                      {post.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex gap-1 flex-wrap">
                      {post.tags.slice(0, 3).map((t) => (
                        <span key={t.name} className="tag text-xs">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden md:table-cell">
                    {post.publishedAt
                      ? post.publishedAt.toLocaleDateString()
                      : post.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        Edit
                      </Link>
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={post.id} />
                        <button
                          type="submit"
                          className="text-xs py-1 px-2 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          Delete
                        </button>
                      </form>
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
