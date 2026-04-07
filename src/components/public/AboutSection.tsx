import Image from "next/image";
import { existsSync } from "fs";
import path from "path";
import { OWNER } from "@/lib/mock-data";

export default function AboutSection() {
  const hasPhoto = existsSync(path.join(process.cwd(), "public/photo.jpg"));

  return (
    <section id="about" className="py-24 border-t border-[#2a2d3a]">
      <div className="section-container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="section-heading">About Me</h2>
            <div className="accent-line" />

            <div className="space-y-4 text-slate-400 leading-relaxed">
              {OWNER.bio.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-8 flex gap-4 flex-wrap">
              <a
                href={OWNER.github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
              >
                GitHub
              </a>
              <a
                href={OWNER.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
              >
                LinkedIn
              </a>
              <a href="/cv.pdf" download className="btn-secondary text-sm">
                CV / Resume
              </a>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            {/* Owner: place your photo at public/photo.jpg — it will appear automatically on next build */}
            <div className="relative">
              <div className="w-64 h-64 rounded-2xl overflow-hidden border border-[#2a2d3a]">
                {hasPhoto ? (
                  <Image
                    src="/photo.jpg"
                    alt={`${OWNER.name} — software engineer`}
                    width={256}
                    height={256}
                    className="object-cover w-full h-full"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-[#1a1d27] flex flex-col items-center justify-center gap-2">
                    <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-mono text-slate-600 text-xs">your-photo.jpg</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 w-64 h-64 rounded-2xl border border-cyan-500/20 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
