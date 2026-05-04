import type { Metadata } from "next";
import PostForm from "@/components/admin/PostForm";

export const metadata: Metadata = { title: "New Post" };

function toSlug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewPostPage({
  searchParams,
}: {
  searchParams: { title?: string };
}) {
  const initialTitle = searchParams?.title ?? "";
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">New post</h1>
      </div>
      <PostForm
        initialData={
          initialTitle
            ? { title: initialTitle, slug: toSlug(initialTitle), excerpt: "", content: "", status: "DRAFT", scheduledFor: null, seoTitle: "", seoDesc: "", tags: [] }
            : undefined
        }
      />
    </div>
  );
}
