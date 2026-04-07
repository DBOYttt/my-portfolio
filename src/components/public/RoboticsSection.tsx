import { ROBOTICS_HIGHLIGHTS } from "@/lib/mock-data";

export default function RoboticsSection() {
  return (
    <section id="robotics" className="py-24 border-t border-[#2a2d3a]">
      <div className="bg-[#1a1d27]/50">
        <div className="section-container py-16">
          <div className="mb-12">
            <p className="font-mono text-cyan-400 text-sm mb-2">
              engineering showcase
            </p>
            <h2 className="section-heading">Robotics & Hardware</h2>
            <div className="accent-line" />
            <p className="text-slate-400 max-w-2xl leading-relaxed">
              Software engineering and robotics aren&apos;t separate disciplines
              for me. I work across the full stack — from firmware to
              high-level planning algorithms — because real systems require
              coherence at every layer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROBOTICS_HIGHLIGHTS.map((item) => (
              <div key={item.title} className="card">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-slate-100 mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 border border-dashed border-[#2a2d3a] rounded-xl text-center">
            <p className="text-slate-600 font-mono text-sm">
              {/* Project gallery and build logs — add photos to make this section shine */}
              Gallery coming soon.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
