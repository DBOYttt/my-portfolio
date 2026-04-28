import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import { getProjectBySlug, getProjects } from "@/lib/data";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import TableOfContents from "@/components/ui/TableOfContents";
import { extractTocHeadings } from "@/lib/markdown";

const TYPE_DISPLAY: Record<string, string> = {
  ROBOTICS: "Robotics",
  SOFTWARE: "Software",
  HARDWARE: "Hardware",
  RESEARCH: "Research",
};

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const projects = await getProjects();
    return projects.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const project = await getProjectBySlug(params.slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      type: "website",
      ...(project.coverImage && { images: [{ url: project.coverImage }] }),
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const project = await getProjectBySlug(params.slug);
  if (!project) notFound();

  const headings = extractTocHeadings(project.content);
  const typeLabel = TYPE_DISPLAY[project.type] ?? project.type;

  return (
    <>
      <Nav />
      <main className="page" style={{ paddingTop: 80, paddingBottom: 64 }}>
        <div style={{ maxWidth: 780 }}>
          <Link
            href="/projects"
            className="btn-link"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 32 }}
          >
            ← Back to projects
          </Link>

          <header style={{ marginBottom: 32 }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase", display: "inline-block", marginBottom: 10 }}>
              {typeLabel}
            </span>
            <h1 style={{ fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: "clamp(26px, 4vw, 36px)", fontWeight: 700, color: "var(--ink)", lineHeight: 1.2, marginBottom: 12 }}>
              {project.title}
            </h1>
            <p style={{ fontSize: 17, color: "var(--ink-soft)", lineHeight: 1.6, maxWidth: "60ch" }}>
              {project.summary}
            </p>
          </header>

          {project.techTags.length > 0 && (
            <div className="entry-tags" style={{ marginBottom: 24 }}>
              {project.techTags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          )}

          {(project.githubUrl || project.liveUrl) && (
            <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn-link">
                  <span className="ar">↗</span> source on github
                </a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn-link">
                  <span className="ar">↗</span> live demo
                </a>
              )}
            </div>
          )}

          {project.coverImage ? (
            <div style={{ marginBottom: 32, overflow: "hidden", border: "1px solid var(--hairline)" }}>
              <Image
                src={project.coverImage}
                alt={project.title}
                width={1200}
                height={600}
                className="w-full object-cover"
              />
            </div>
          ) : (
            <div style={{ marginBottom: 32, height: 160, background: "var(--paper-2)", border: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: "var(--ink-faint)" }}>no cover image</span>
            </div>
          )}

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
              <MarkdownRenderer content={project.content} />
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
