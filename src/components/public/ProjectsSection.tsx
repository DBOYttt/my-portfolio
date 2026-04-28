import { getProjects } from "@/lib/data";
import ProjectFilter from "./ProjectFilter";
import { SectionHead } from "@/components/ui/hand-drawn";

export default async function ProjectsSection() {
  const projects = await getProjects();

  return (
    <section id="projects" className="logbook-section">
      <SectionHead
        num="03"
        kicker="Projects"
        meta="Field entries, in chronological-ish order"
        title={
          <>
            Selected <em>entries.</em>
          </>
        }
        sub="Projects spanning robotics, software and embedded systems. Each one is a write-up of what I built, what broke, and what I'd do differently."
      />
      <ProjectFilter projects={projects} />
    </section>
  );
}
