import { getSkills } from "@/lib/data";

export default async function SkillsSection() {
  const skills = await getSkills();
  return (
    <section id="skills" className="py-24 border-t border-[#2a2d3a]">
      <div className="section-container">
        <h2 className="section-heading">Skills</h2>
        <div className="accent-line" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((group) => (
            <div key={group.category} className="card">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                {group.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span key={skill} className="tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-slate-600 text-sm font-mono">
          {/* Skills reflect current working knowledge. Not exhaustive. */}
        </p>
      </div>
    </section>
  );
}
