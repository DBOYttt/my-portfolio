import React from "react";
import { Sequence } from "remotion";
import { TitleCard } from "./scenes/TitleCard";
import { PublicHero } from "./scenes/PublicHero";
import { PublicAbout } from "./scenes/PublicAbout";
import { PublicProjects } from "./scenes/PublicProjects";
import { PublicBlog } from "./scenes/PublicBlog";
import { PublicContact } from "./scenes/PublicContact";
import { AdminTransition } from "./scenes/AdminTransition";
import { AdminDashboard } from "./scenes/AdminDashboard";
import { AdminBlogEditor } from "./scenes/AdminBlogEditor";
import { AdminAgents } from "./scenes/AdminAgents";
import { AdminCareer } from "./scenes/AdminCareer";
import { EndCard } from "./scenes/EndCard";

// Scene schedule (start frame, duration in frames at 30fps):
// TitleCard        0    → 90
// PublicHero       90   → 300
// PublicAbout      390  → 270
// PublicProjects   660  → 300
// PublicBlog       960  → 240
// PublicContact    1200 → 150
// AdminTransition  1350 → 90
// AdminDashboard   1440 → 270
// AdminBlogEditor  1710 → 360
// AdminAgents      2070 → 330
// AdminCareer      2400 → 270
// EndCard          2670 → 150
// Total:                  2820 frames ≈ 94 seconds

export const PortfolioDemo: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={90} name="TitleCard">
        <TitleCard />
      </Sequence>

      <Sequence from={90} durationInFrames={300} name="PublicHero">
        <PublicHero />
      </Sequence>

      <Sequence from={390} durationInFrames={270} name="PublicAbout">
        <PublicAbout />
      </Sequence>

      <Sequence from={660} durationInFrames={300} name="PublicProjects">
        <PublicProjects />
      </Sequence>

      <Sequence from={960} durationInFrames={240} name="PublicBlog">
        <PublicBlog />
      </Sequence>

      <Sequence from={1200} durationInFrames={150} name="PublicContact">
        <PublicContact />
      </Sequence>

      <Sequence from={1350} durationInFrames={90} name="AdminTransition">
        <AdminTransition />
      </Sequence>

      <Sequence from={1440} durationInFrames={270} name="AdminDashboard">
        <AdminDashboard />
      </Sequence>

      <Sequence from={1710} durationInFrames={360} name="AdminBlogEditor">
        <AdminBlogEditor />
      </Sequence>

      <Sequence from={2070} durationInFrames={330} name="AdminAgents">
        <AdminAgents />
      </Sequence>

      <Sequence from={2400} durationInFrames={270} name="AdminCareer">
        <AdminCareer />
      </Sequence>

      <Sequence from={2670} durationInFrames={150} name="EndCard">
        <EndCard />
      </Sequence>
    </>
  );
};
