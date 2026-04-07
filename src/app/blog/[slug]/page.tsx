import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/data";
import { OWNER } from "@/lib/mock-data";

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const posts = await getBlogPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDesc ?? post.excerpt,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDesc ?? post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16">
        <div className="section-container max-w-3xl">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-sm text-slate-500 hover:text-cyan-400 transition-colors mb-8"
          >
            ← Back to blog
          </Link>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 font-mono text-xs text-slate-500 mb-4">
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime} read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
              {post.title}
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              {post.excerpt}
            </p>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {post.tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}

          {/* JSON-LD Article schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: post.title,
                description: post.excerpt,
                author: {
                  "@type": "Person",
                  name: OWNER.name,
                },
                datePublished:
                  post.publishedAt?.toISOString() ?? post.date,
                url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://yourdomain.com"}/blog/${post.slug}`,
              }),
            }}
          />

          {/* Content */}
          <div className="border-t border-[#2a2d3a] pt-8">
            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">
              {/* TODO(M3): replace with markdown renderer */}
              {post.content}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
