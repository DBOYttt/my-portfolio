import Nav from "@/components/public/Nav";
import HeroSection from "@/components/public/HeroSection";
import AboutSection from "@/components/public/AboutSection";
import SkillsSection from "@/components/public/SkillsSection";
import ExperienceSection from "@/components/public/ExperienceSection";
import ProjectsSection from "@/components/public/ProjectsSection";
import RoboticsSection from "@/components/public/RoboticsSection";
import ContactSection from "@/components/public/ContactSection";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <RoboticsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
