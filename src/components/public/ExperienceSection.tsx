const experiences = [
  {
    company: "Your Company",
    role: "Software Engineer",
    period: "2023 — Present",
    description:
      "Describe what you worked on, what you shipped, and what impact it had. Use numbers where possible.",
    type: "Full-time",
  },
  {
    company: "Previous Company",
    role: "Junior Developer",
    period: "2021 — 2023",
    description:
      "Describe your contributions. Focus on outcomes, not just responsibilities.",
    type: "Full-time",
  },
  {
    company: "Internship or Project",
    role: "Robotics Intern",
    period: "2020 — 2021",
    description:
      "Describe what you built or contributed to during the internship.",
    type: "Internship",
  },
];

export default function ExperienceSection() {
  return (
    <section id="experience" className="py-24 border-t border-[#2a2d3a]">
      <div className="section-container">
        <h2 className="section-heading">Experience</h2>
        <div className="accent-line" />

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-[#2a2d3a] ml-1.5" />

          <div className="space-y-10 pl-8">
            {experiences.map((exp, i) => (
              <div key={i} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-8 top-1.5 w-3 h-3 rounded-full bg-cyan-500/30 border border-cyan-500" />

                <div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <h3 className="font-semibold text-slate-100">{exp.role}</h3>
                    <span className="text-cyan-400 text-sm">@ {exp.company}</span>
                    <span className="text-[#2a2d3a] hidden sm:block">—</span>
                    <span className="font-mono text-xs text-slate-500">
                      {exp.type}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-500 mb-3">
                    {exp.period}
                  </p>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {exp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
