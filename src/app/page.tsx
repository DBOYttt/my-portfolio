import { OWNER } from "@/lib/mock-data";
import Nav from "@/components/public/Nav";
import HeroSection from "@/components/public/HeroSection";
import AboutSection from "@/components/public/AboutSection";
import SkillsSection from "@/components/public/SkillsSection";
import ExperienceSection from "@/components/public/ExperienceSection";
import ProjectsSection from "@/components/public/ProjectsSection";
import RoboticsSection from "@/components/public/RoboticsSection";
import BlogPreviewSection from "@/components/public/BlogPreviewSection";
import ContactSection from "@/components/public/ContactSection";
import Footer from "@/components/public/Footer";
import MockModeBanner from "@/components/public/MockModeBanner";

export default function HomePage() {
  const isMockMode = !process.env.DATABASE_URL;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: OWNER.name,
            url: process.env.NEXT_PUBLIC_BASE_URL ?? "https://yourdomain.com",
            sameAs: [OWNER.github, OWNER.linkedin],
            jobTitle: "Software Engineer",
            email: OWNER.email,
          }),
        }}
      />
      <Nav />
      {isMockMode && <MockModeBanner />}
      <main>
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <RoboticsSection />
        <BlogPreviewSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
