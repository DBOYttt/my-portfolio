/**
 * Mock data for zero-config preview mode.
 * Replace these values with your real information before going live.
 * When DATABASE_URL is configured, the admin panel will serve real data from the DB.
 */

export const OWNER = {
  name: "Alex Kowalski",
  tagline: "Software Engineer. I also build robots.",
  bio: [
    "I'm a software engineer with a strong interest in robotics and embedded systems. I enjoy working at the intersection of software and hardware — writing code that controls real things in the physical world.",
    "My background spans from low-level embedded C/C++ to high-level Python automation pipelines. I'm comfortable with ROS2, Linux systems, and building reliable software that runs under constraints.",
    "Outside of engineering, I document my work publicly through open-source projects and technical writing. I believe in building things that are useful, not just technically impressive.",
  ],
  email: "alex@example.com",
  github: "https://github.com/yourusername",
  linkedin: "https://linkedin.com/in/yourusername",
  location: "Warsaw, Poland",
};

export const SKILLS = [
  {
    category: "Languages",
    skills: ["Python", "TypeScript", "C++", "C", "Rust", "Bash"],
  },
  {
    category: "Frameworks & Libraries",
    skills: ["Next.js", "React", "FastAPI", "Node.js", "Prisma"],
  },
  {
    category: "Robotics & Embedded",
    skills: ["ROS2", "ROS", "SLAM", "OpenCV", "Arduino", "STM32", "FreeRTOS"],
  },
  {
    category: "Tools & Infrastructure",
    skills: ["Docker", "Git", "Linux", "Nginx", "PostgreSQL", "n8n"],
  },
];

export const EXPERIENCE = [
  {
    company: "Robotics Startup",
    role: "Software Engineer",
    period: "2023 — Present",
    type: "Full-time",
    description:
      "Led development of the motion planning stack for an autonomous mobile robot. Reduced path replanning latency by 35% through custom A* heuristic tuning and ROS2 lifecycle node architecture.",
  },
  {
    company: "Tech Company",
    role: "Backend Developer",
    period: "2021 — 2023",
    type: "Full-time",
    description:
      "Built and maintained REST APIs serving 200k+ daily requests. Migrated a legacy monolith to containerised services, cutting deployment time from 45 minutes to under 4.",
  },
  {
    company: "University Lab",
    role: "Robotics Research Intern",
    period: "2020 — 2021",
    type: "Internship",
    description:
      "Implemented a sensor fusion pipeline for a hexapod walking robot using IMU and optical flow data. Published results in a departmental proceedings paper.",
  },
];

export const PROJECTS = [
  {
    slug: "autonomous-nav-robot",
    title: "Autonomous Navigation Robot",
    summary:
      "ROS2-based differential drive robot with custom SLAM implementation. Reduced localization error by 40% vs. baseline using particle filter tuning and a LiDAR preprocessing stage.",
    techTags: ["ROS2", "Python", "C++", "SLAM", "LiDAR", "OpenCV"],
    type: "ROBOTICS" as const,
    githubUrl: "https://github.com/yourusername/autonomous-nav-robot",
    liveUrl: null,
  },
  {
    slug: "automation-pipeline",
    title: "Event-Driven Automation Pipeline",
    summary:
      "Async Python pipeline handling 50k+ events/day with sub-100ms p95 latency. Built with FastAPI, PostgreSQL, and n8n for workflow orchestration.",
    techTags: ["Python", "FastAPI", "PostgreSQL", "Docker", "n8n", "Redis"],
    type: "SOFTWARE" as const,
    githubUrl: "https://github.com/yourusername/automation-pipeline",
    liveUrl: "https://example.com",
  },
  {
    slug: "embedded-sensor-system",
    title: "Multi-Sensor Fusion Firmware",
    summary:
      "Real-time sensor fusion on STM32F4 aggregating IMU, GPS, and ultrasonic data at 200Hz. Custom Kalman filter implementation in bare-metal C.",
    techTags: ["C", "STM32", "FreeRTOS", "Kalman Filter", "SPI", "I2C"],
    type: "HARDWARE" as const,
    githubUrl: "https://github.com/yourusername/sensor-fusion",
    liveUrl: null,
  },
];

export const ROBOTICS_HIGHLIGHTS = [
  {
    icon: "🤖",
    title: "Autonomous Systems",
    description:
      "Mobile robot platforms with autonomous navigation using ROS2, SLAM, and sensor fusion. From design to working prototype.",
  },
  {
    icon: "⚡",
    title: "Embedded Development",
    description:
      "Firmware on STM32 and Arduino platforms. Real-time systems with FreeRTOS, bare-metal C, and custom peripheral drivers.",
  },
  {
    icon: "👁️",
    title: "Computer Vision",
    description:
      "OpenCV pipelines for object detection, optical flow, and depth estimation integrated into real-time robotic control loops.",
  },
  {
    icon: "🔧",
    title: "Hardware Integration",
    description:
      "End-to-end co-design: sensor selection, calibration, PCB layout review, and actuator control from software to physical output.",
  },
];

export const BLOG_POSTS: {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
  seoTitle: string | null;
  seoDesc: string | null;
  publishedAt: Date | null;
}[] = [
  {
    slug: "ros2-slam-from-scratch",
    title: "Implementing SLAM from Scratch with ROS2",
    excerpt:
      "A deep dive into building a particle filter SLAM implementation for a differential drive robot, from math to working code.",
    date: "2024-03-15",
    readTime: "12 min",
    tags: ["ROS2", "SLAM", "Robotics"],
    content: "*Full post content is not available in preview mode.*",
    seoTitle: null,
    seoDesc: null,
    publishedAt: null,
  },
  {
    slug: "freertos-on-stm32",
    title: "FreeRTOS on STM32: Task Scheduling for Sensor Fusion",
    excerpt:
      "How I structured a multi-task FreeRTOS firmware to fuse IMU and GPS data at 200Hz without priority inversion.",
    date: "2024-02-08",
    readTime: "8 min",
    tags: ["Embedded", "FreeRTOS", "STM32"],
    content: "*Full post content is not available in preview mode.*",
    seoTitle: null,
    seoDesc: null,
    publishedAt: null,
  },
  {
    slug: "n8n-home-automation",
    title: "Building a Personal Automation Stack with n8n",
    excerpt:
      "Self-hosting n8n to automate repetitive tasks: GitHub digests, news curation, and monitoring — without handing data to third parties.",
    date: "2024-01-22",
    readTime: "6 min",
    tags: ["Automation", "n8n", "Self-hosted"],
    content: "*Full post content is not available in preview mode.*",
    seoTitle: null,
    seoDesc: null,
    publishedAt: null,
  },
];
