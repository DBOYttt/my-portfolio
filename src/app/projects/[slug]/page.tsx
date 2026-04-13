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

const typeColors: Record<string, string> = {
  ROBOTICS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  SOFTWARE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  HARDWARE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  RESEARCH: "text-purple-400 bg-purple-500/10 border-purple-500/20",
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
  const typeColor = typeColors[project.type] ?? typeColors["SOFTWARE"];

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16">
        <div className="section-container">
          {/* Back link */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 font-mono text-sm text-slate-500 hover:text-cyan-400 transition-colors mb-8"
          >
            ← Back to projects
          </Link>

          {/* Header */}
          <div className="mb-8">
            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${typeColor} inline-block mb-4`}>
              {project.type.charAt(0) + project.type.slice(1).toLowerCase()}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">
              {project.title}
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
              {project.summary}
            </p>
          </div>

          {/* Tech tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {project.techTags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          {/* Links */}
          {(project.githubUrl || project.liveUrl) && (
            <div className="flex gap-4 mb-10">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  View on GitHub
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary text-sm"
                >
                  Live Demo
                </a>
              )}
            </div>
          )}

          {/* Cover image */}
          {project.coverImage ? (
            <div className="mb-10 rounded-2xl overflow-hidden border border-[#2a2d3a]">
              <Image
                src={project.coverImage}
                alt={project.title}
                width={1200}
                height={600}
                className="w-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-10 h-48 rounded-2xl bg-[#1a1d27] border border-[#2a2d3a] flex items-center justify-center">
              <span className="font-mono text-slate-700 text-sm">no cover image</span>
            </div>
          )}

          {/* Content */}
          <div className="max-w-3xl">
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
