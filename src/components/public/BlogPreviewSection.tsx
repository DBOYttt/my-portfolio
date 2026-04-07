import Link from "next/link";
import { getBlogPosts } from "@/lib/data";

export default async function BlogPreviewSection() {
  const allPosts = await getBlogPosts();
  const posts = allPosts.slice(0, 3);

  return (
    <section id="blog" className="py-24 border-t border-[#2a2d3a]">
      <div className="section-container">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-heading">Blog</h2>
            <div className="accent-line mb-0" />
          </div>
          <Link
            href="/blog"
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
          >
            All posts →
          </Link>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="card flex flex-col sm:flex-row sm:items-center gap-4 group cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <h3 className="font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors mb-1">
                  {post.title}
                </h3>
                <p className="text-slate-400 text-sm">{post.excerpt}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-xs text-slate-500">{post.date}</p>
                <p className="font-mono text-xs text-slate-600">{post.readTime} read</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
