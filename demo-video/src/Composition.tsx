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
// TitleCard      0    → 70
// PublicHero     70   → 150
// PublicAbout    220  → 140
// PublicProjects 360  → 150
// PublicBlog     510  → 120
// PublicContact  630  → 90
// AdminTransition 720 → 60
// AdminDashboard 780  → 150
// AdminBlogEditor 930 → 180
// AdminAgents    1110 → 180
// AdminCareer    1290 → 150
// EndCard        1440 → 130
// Total:                1570 frames ≈ 52.3 seconds

export const PortfolioDemo: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={70} name="TitleCard">
        <TitleCard />
      </Sequence>

      <Sequence from={70} durationInFrames={150} name="PublicHero">
        <PublicHero />
      </Sequence>

      <Sequence from={220} durationInFrames={140} name="PublicAbout">
        <PublicAbout />
      </Sequence>

      <Sequence from={360} durationInFrames={150} name="PublicProjects">
        <PublicProjects />
      </Sequence>

      <Sequence from={510} durationInFrames={120} name="PublicBlog">
        <PublicBlog />
      </Sequence>

      <Sequence from={630} durationInFrames={90} name="PublicContact">
        <PublicContact />
      </Sequence>

      <Sequence from={720} durationInFrames={60} name="AdminTransition">
        <AdminTransition />
      </Sequence>

      <Sequence from={780} durationInFrames={150} name="AdminDashboard">
        <AdminDashboard />
      </Sequence>

      <Sequence from={930} durationInFrames={180} name="AdminBlogEditor">
        <AdminBlogEditor />
      </Sequence>

      <Sequence from={1110} durationInFrames={180} name="AdminAgents">
        <AdminAgents />
      </Sequence>

      <Sequence from={1290} durationInFrames={150} name="AdminCareer">
        <AdminCareer />
      </Sequence>

      <Sequence from={1440} durationInFrames={130} name="EndCard">
        <EndCard />
      </Sequence>
    </>
  );
};
