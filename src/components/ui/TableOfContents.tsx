import type { TocHeading } from "@/lib/markdown";

interface Props {
  headings: TocHeading[];
}

export default function TableOfContents({ headings }: Props) {
  if (headings.length < 3) return null;

  return (
    <nav>
      <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-3">
        Contents
      </p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: `${(h.depth - 1) * 0.75}rem` }}>
            <a
              href={`#${h.id}`}
              className="block text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors leading-relaxed truncate"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
