import type { Metadata } from "next";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import { getBlogPosts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Blog",
  description: "Technical writing on software engineering, robotics, and embedded systems.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();
  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16">
        <div className="section-container">
          <h1 className="section-heading">Blog</h1>
          <div className="accent-line" />
          <p className="text-slate-400 mb-12">
            Technical writing on software engineering, embedded systems, and robotics.
          </p>

          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="card flex flex-col sm:flex-row sm:items-center gap-4 group"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                  <h2 className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors mb-1">
                    {post.title}
                  </h2>
                  <p className="text-slate-400 text-sm">{post.excerpt}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs text-slate-500">{post.date}</p>
                  <p className="font-mono text-xs text-slate-600">{post.readTime} read</p>
                </div>
              </article>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="border border-dashed border-[#2a2d3a] rounded-xl p-12 text-center">
              <p className="text-slate-600 font-mono text-sm">
                // No posts yet — add them in src/lib/mock-data.ts or via the admin panel
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
