// Real portfolio content from src/lib/mock-data.ts
export const OWNER = {
  name: "Andrzej Czajkowski-Nazim",
  nameParts: ["Andrzej", "Czajkowski-", "Nazim"],
  tagline: "Software engineer. Robotics enthusiast. Always building.",
  status: "Open to opportunities — Spring 2026",
  bio: "Software engineer with a foundation in designing, programming, and testing applications. Working at the intersection of software and hardware — from database-backed web apps to autonomous robots competing on an international stage.",
  email: "andrzejczn@diboy.dev",
  github: "https://github.com/DBOYttt",
  location: "Kraków, Poland",
};

export const SKILLS = [
  { category: "Languages",              skills: ["C#", "C++", "Python", "TypeScript", "JavaScript", "Node.js", "Java"] },
  { category: "Frameworks & Libraries", skills: [".NET", "Next.js", "Prisma", "Three.js"] },
  { category: "Robotics & Embedded",    skills: ["Arduino", "WPILib", "CAD", "Fusion 360"] },
  { category: "Tools & Infrastructure", skills: ["Docker", "Git", "PostgreSQL", "Linux", "n8n"] },
  { category: "Machine Learning",       skills: ["PyTorch", "scikit-learn", "Matplotlib"] },
];

export const PROJECTS = [
  {
    title: "Autonomous Navigation Robot", year: "2024", type: "ROBOTICS",
    summary: "ROS2-based differential drive robot with custom SLAM implementation. Reduced localization error by 40% vs. baseline using particle filter tuning and a LiDAR preprocessing stage.",
    tags: ["ROS2", "Python", "C++", "SLAM", "LiDAR"],
  },
  {
    title: "Event-Driven Automation Pipeline", year: "2024", type: "SOFTWARE",
    summary: "Async Python pipeline handling 50k+ events/day with sub-100ms p95 latency. Built with FastAPI, PostgreSQL, and n8n for workflow orchestration.",
    tags: ["Python", "FastAPI", "PostgreSQL", "Docker", "n8n"],
  },
  {
    title: "Multi-Sensor Fusion Firmware", year: "2023", type: "HARDWARE",
    summary: "Real-time sensor fusion on STM32F4 aggregating IMU, GPS, and ultrasonic data at 200Hz. Custom Kalman filter in bare-metal C.",
    tags: ["C", "STM32", "FreeRTOS", "Kalman Filter"],
  },
  {
    title: "Personal Portfolio Platform", year: "2025", type: "SOFTWARE",
    summary: "Two-layer Next.js platform — public portfolio and private admin with content editor, agent orchestration, and a CV generator.",
    tags: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Claude API"],
  },
];

export const BLOG_POSTS = [
  {
    title: "Implementing SLAM from Scratch with ROS2",
    date: "2024-03-15", readTime: "12 min",
    excerpt: "A deep dive into building a particle filter SLAM implementation for a differential drive robot, from math to working code.",
    tags: ["ROS2", "SLAM", "Robotics"],
  },
  {
    title: "FreeRTOS on STM32: Task Scheduling for Sensor Fusion",
    date: "2024-02-08", readTime: "8 min",
    excerpt: "How I structured FreeRTOS tasks to read four sensors simultaneously without race conditions, with practical priority assignment tips.",
    tags: ["STM32", "FreeRTOS", "Embedded"],
  },
  {
    title: "Building a Personal Automation Stack with n8n",
    date: "2024-01-22", readTime: "6 min",
    excerpt: "Self-hosted n8n, PostgreSQL, and a few custom nodes — how I automated my workflow without writing a single line of glue code.",
    tags: ["n8n", "Automation", "Self-hosted"],
  },
];

export const EXPERIENCE = [
  { company: "NewTech", role: "Database Administration Intern", period: "2021 — 2023", type: "Internship" },
  { company: "Team 9155, FRC", role: "Member & Team Captain", period: "2020 — 2024", type: "Volunteer" },
  { company: "Fundacja IB Polska & ZHP", role: "Volunteer", period: "2024", type: "Volunteer" },
  { company: "JCC Krakow", role: "Volunteer", period: "2021 — 2022", type: "Volunteer" },
];

export const AGENTS = [
  { name: "GitHub Summarizer",      desc: "Summarises recent GitHub activity + profile gaps",        status: "completed", badge: "weekly" },
  { name: "Robotics News",          desc: "Weekly digest from public robotics RSS feeds",             status: "completed", badge: "weekly" },
  { name: "Blog Suggester",         desc: "Suggests blog topics from GitHub + post history",          status: "completed", badge: "weekly" },
  { name: "Brand Monitor",          desc: "Monitors online mentions of the portfolio owner",          status: "scheduled", badge: "weekly" },
  { name: "Skills Inference",       desc: "Diffs GitHub repo languages against DB skills",            status: "completed", badge: "weekly" },
  { name: "Project Importer",       desc: "Suggests new projects from public GitHub repos",           status: "completed", badge: "weekly" },
  { name: "Platform Sync",          desc: "Pulls GitHub profile + X/Twitter data",                   status: "scheduled", badge: "weekly" },
];
