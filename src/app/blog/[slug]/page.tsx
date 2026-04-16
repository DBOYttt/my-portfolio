import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/data";
import { OWNER } from "@/lib/mock-data";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import TableOfContents from "@/components/ui/TableOfContents";
import { extractTocHeadings } from "@/lib/markdown";

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
    title: post.seoTitle || post.title,
    description: post.seoDesc || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDesc || post.excerpt,
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

  const headings = extractTocHeadings(post.content);

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
            {/* Mobile ToC — collapsible, hidden on lg */}
            {headings.length >= 3 && (
              <details className="lg:hidden mb-6 border border-[#2a2d3a] rounded-lg p-4">
                <summary className="text-xs font-mono text-slate-500 uppercase tracking-wider cursor-pointer">
                  Contents
                </summary>
                <div className="mt-3">
                  <TableOfContents headings={headings} />
                </div>
              </details>
            )}

            <div className={headings.length >= 3 ? "lg:grid lg:grid-cols-[1fr_220px] lg:gap-12 lg:items-start" : undefined}>
              <MarkdownRenderer content={post.content} />
              {headings.length >= 3 && (
                <aside className="hidden lg:block sticky top-24 self-start">
                  <TableOfContents headings={headings} />
                </aside>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
