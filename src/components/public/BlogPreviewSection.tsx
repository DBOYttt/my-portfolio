import Link from "next/link";
import { getBlogPosts } from "@/lib/data";
import { SectionHead } from "@/components/ui/hand-drawn";

export default async function BlogPreviewSection() {
  const allPosts = await getBlogPosts();
  const posts = allPosts.slice(0, 3);
  if (posts.length === 0) return null;

  return (
    <section id="writing" className="logbook-section">
      <SectionHead
        num="06"
        kicker="Writing"
        meta="Long-form notes from the workbench"
        title={
          <>
            Recent <em>dispatches.</em>
          </>
        }
      />
      <div className="logbook-row">
        <aside className="margin" />
        <div>
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="entry"
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr auto",
                  gap: 24,
                  alignItems: "baseline",
                }}
                className="post-row"
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    color: "var(--ink-faint)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {post.date}
                </span>
                <div>
                  <h3
                    className="serif"
                    style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.2 }}
                  >
                    {post.title}
                  </h3>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 16,
                      lineHeight: 1.5,
                      maxWidth: "62ch",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {post.excerpt}
                  </p>
                  <div className="entry-tags" style={{ marginTop: 10 }}>
                    {post.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-faint)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {post.readTime} →
                </span>
              </div>
            </Link>
          ))}

          <div style={{ marginTop: 24, paddingTop: 16 }}>
            <Link
              href="/blog"
              className="btn-link"
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              All entries <span className="arr">→</span>
            </Link>
          </div>

          <style>{`@media (max-width:760px){ .post-row { grid-template-columns: 1fr !important; } }`}</style>
        </div>
      </div>
    </section>
  );
}
