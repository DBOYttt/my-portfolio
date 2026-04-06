import { OWNER } from "@/lib/mock-data";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#2a2d3a] py-8">
      <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono text-xs text-slate-600">
          &copy; {year} {OWNER.name}. Built with Next.js.
        </p>

        <div className="flex gap-6">
          <a href="#hero" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Back to top
          </a>
          <a href="/blog" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Blog
          </a>
          <a
            href={OWNER.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
