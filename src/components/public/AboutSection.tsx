export default function AboutSection() {
  return (
    <section id="about" className="py-24 border-t border-[#2a2d3a]">
      <div className="section-container">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="section-heading">About Me</h2>
            <div className="accent-line" />

            <div className="space-y-4 text-slate-400 leading-relaxed">
              <p>
                I&apos;m a software engineer with a strong interest in robotics and
                embedded systems. I enjoy working at the intersection of software
                and hardware — writing code that controls real things in the
                physical world.
              </p>
              <p>
                My background spans from low-level embedded C/C++ to high-level
                Python automation pipelines. I&apos;m comfortable with ROS2, Linux
                systems, and building reliable software that runs under
                constraints.
              </p>
              <p>
                Outside of engineering, I document my work publicly through
                open-source projects and technical writing. I believe in building
                things that are useful, not just technically impressive.
              </p>
            </div>

            <div className="mt-8 flex gap-4 flex-wrap">
              <a
                href="https://github.com/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/yourusername"
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

          {/* Photo placeholder */}
          <div className="flex justify-center md:justify-end">
            <div className="relative">
              <div className="w-64 h-64 rounded-2xl bg-[#1a1d27] border border-[#2a2d3a] flex items-center justify-center">
                <span className="font-mono text-slate-600 text-sm">
                  photo.jpg
                </span>
              </div>
              {/* Decorative accent */}
              <div className="absolute -bottom-3 -right-3 w-64 h-64 rounded-2xl border border-cyan-500/20 -z-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
