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
      <main className="page" style={{ paddingTop: 80, paddingBottom: 64 }}>
        <div style={{ maxWidth: 780 }}>
          <Link
            href="/blog"
            className="btn-link"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}
          >
            ← Back to writing
          </Link>

          <header style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--ink-faint)", marginBottom: 12 }}>
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime} read</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: 12 }}>
              {post.title}
            </h1>
            <p style={{ fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.6, maxWidth: "60ch" }}>
              {post.excerpt}
            </p>
          </header>

          {post.tags.length > 0 && (
            <div className="entry-tags" style={{ marginBottom: 32 }}>
              {post.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          )}

          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: post.title,
                description: post.excerpt,
                author: { "@type": "Person", name: OWNER.name },
                datePublished: post.publishedAt?.toISOString() ?? post.date,
                url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://yourdomain.com"}/blog/${post.slug}`,
              }),
            }}
          />

          <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 32 }}>
            {headings.length >= 3 && (
              <details className="lg:hidden" style={{ marginBottom: 24, border: "1px solid var(--hairline)", padding: 16 }}>
                <summary style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer" }}>
                  Contents
                </summary>
                <div style={{ marginTop: 12 }}>
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
