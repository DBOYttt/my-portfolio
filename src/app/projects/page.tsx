import type { Metadata } from "next";
import Nav from "@/components/public/Nav";
import Footer from "@/components/public/Footer";
import ProjectFilter from "@/components/public/ProjectFilter";
import { getProjects } from "@/lib/data";
import { OWNER } from "@/lib/mock-data";
import { SectionHead } from "@/components/ui/hand-drawn";

export const metadata: Metadata = {
  title: "Projects",
  description: `Software, robotics, hardware, and research projects by ${OWNER.name}.`,
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <Nav />
      <main className="page" style={{ paddingTop: 80, paddingBottom: 64 }}>
        <SectionHead
          num="03"
          kicker="Projects"
          title={<>Selected <em>entries.</em></>}
          meta="Field entries"
          sub="Projects spanning robotics, software and embedded systems."
        />
        <ProjectFilter projects={projects} />
      </main>
      <Footer />
    </>
  );
}
