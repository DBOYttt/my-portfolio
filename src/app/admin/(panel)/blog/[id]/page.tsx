import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PostForm from "@/components/admin/PostForm";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { tags: true },
  });
  if (!post) notFound();

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Edit post</h1>
        <p className="text-slate-500 font-mono text-sm mt-0.5">{post.slug}</p>
      </div>
      <PostForm initialData={post} postId={post.id} />
    </div>
  );
}
