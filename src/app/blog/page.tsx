export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import { getBlogPosts } from "@/lib/data";
import { SectionHead } from "@/components/ui/hand-drawn";

export const metadata: Metadata = {
  title: "Writing",
  description: "Technical writing on software engineering, robotics, and embedded systems.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <Nav />
      <main className="page" style={{ paddingTop: 80, paddingBottom: 64 }}>
        <SectionHead
          num="06"
          kicker="Writing"
          title={<>Field <em>notes.</em></>}
          meta="Technical writing"
          sub="Write-ups on software engineering, embedded systems, and robotics."
        />

        {posts.length === 0 ? (
          <div className="logbook-row">
            <aside className="margin" />
            <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, color: "var(--ink-faint)" }}>
              No posts yet.
            </p>
          </div>
        ) : (
          posts.map((post, i) => (
            <div key={post.slug} className="logbook-row">
              <aside className="margin">
                <span className="meta">{post.date}</span>
                <span className="meta">{post.readTime} read</span>
              </aside>
              <article className="entry">
                <div className="entry-head">
                  <span className="entry-num">{String(i + 1).padStart(2, "0")}</span>
                  <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <h2 className="entry-title">{post.title}</h2>
                  </Link>
                  <span className="entry-meta-right">{post.date}</span>
                </div>
                <div className="entry-body">
                  <div />
                  <div>
                    <p className="entry-summary">{post.excerpt}</p>
                    <div className="entry-tags">
                      {post.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <div className="entry-actions">
                      <Link href={`/blog/${post.slug}`} className="btn-link">
                        <span className="ar">↗</span> read post
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          ))
        )}
      </main>
      <Footer />
    </>
  );
}
