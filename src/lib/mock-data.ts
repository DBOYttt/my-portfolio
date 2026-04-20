/**
 * Mock data for zero-config preview mode.
 * Replace these values with your real information before going live.
 * When DATABASE_URL is configured, the admin panel will serve real data from the DB.
 */

export const OWNER = {
  name: "Andrzej Czajkowski-Nazim",
  tagline: "Software engineer. Robotics enthusiast. Always building.",
  bio: [
    "I'm a software engineer with a passion for robotics and embedded systems. I enjoy working at the intersection of software and hardware — writing code that interacts with the physical world. Whether it's a web application or an autonomous robot, I care about building things that actually work.",
    "My background spans C#, C++, Python, TypeScript, and Java, with hands-on experience in .NET, Next.js, Docker, and databases. I've worked on data management systems, AI agents, RAG pipelines, and machine learning — from model fine-tuning to production deployment.",
  ],
  email: "andrzejcn041@gmail.com",
  github: "https://github.com/DBOYttt",
  linkedin: "https://www.linkedin.com/in/andrzej-nazim-290a451b4/",
  location: "Kraków, Poland",
};

export const SKILLS = [
  {
    category: "Languages",
    skills: ["C#", "C++", "Python", "TypeScript", "JavaScript", "Node.js", "Java"],
  },
  {
    category: "Frameworks & Libraries",
    skills: [".NET", "Next.js", "Prisma", "Node.js"],
  },
  {
    category: "Robotics & Embedded",
    skills: ["Arduino", "WPILib", "CAD", "Fusion 360"],
  },
  {
    category: "Tools & Infrastructure",
    skills: ["Docker", "Git", "PostgreSQL", "SQL", "Linux"],
  },
  {
    category: "Machine Learning",
    skills: ["PyTorch", "scikit-learn", "Matplotlib", "model fine-tuning"],
  },
];

export const EXPERIENCE = [
  {
    company: "New Technology Kraków",
    role: "Data Management Specialist",
    period: "Jan 2021 — Jan 2023",
    type: "Internship",
    description:
      "Optimised SQL queries and maintained database structures for consistency; collaborated with developers to design and test API interfaces.",
  },
  {
    company: "Team 9155, First Robotics Competition (FRC)",
    role: "Member & Team Captain",
    period: "2020 — 2024",
    type: "Volunteer",
    description:
      "Led a student team in designing, building, and programming competitive robots — coordinating task delegation, project planning, and contest strategy under strict deadlines.",
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
    githubUrl: "https://github.com/DBOYttt/autonomous-nav-robot",
    liveUrl: null,
  },
  {
    slug: "automation-pipeline",
    title: "Event-Driven Automation Pipeline",
    summary:
      "Async Python pipeline handling 50k+ events/day with sub-100ms p95 latency. Built with FastAPI, PostgreSQL, and n8n for workflow orchestration.",
    techTags: ["Python", "FastAPI", "PostgreSQL", "Docker", "n8n", "Redis"],
    type: "SOFTWARE" as const,
    githubUrl: "https://github.com/DBOYttt/automation-pipeline",
    liveUrl: null,
  },
  {
    slug: "embedded-sensor-system",
    title: "Multi-Sensor Fusion Firmware",
    summary:
      "Real-time sensor fusion on STM32F4 aggregating IMU, GPS, and ultrasonic data at 200Hz. Custom Kalman filter implementation in bare-metal C.",
    techTags: ["C", "STM32", "FreeRTOS", "Kalman Filter", "SPI", "I2C"],
    type: "HARDWARE" as const,
    githubUrl: "https://github.com/DBOYttt/sensor-fusion",
    liveUrl: null,
  },
];

export const ROBOTICS_HIGHLIGHTS = [
  {
    icon: "",
    title: "Autonomous Systems",
    description:
      "Designing and programming autonomous robot behaviors for competition, using sensor feedback, control loops, and drive systems that react to the field in real time.",
  },
  {
    icon: "",
    title: "Competition Robotics",
    description:
      "Built and competed with FRC robots under strict deadlines, coordinating mechanical, electrical, and software subsystems as team captain.",
  },
  {
    icon: "",
    title: "Embedded Development",
    description:
      "Programming microcontrollers with Arduino and WPILib for real-time motor control, sensor reading, and hardware interfacing.",
  },
  {
    icon: "",
    title: "CAD & Mechanical Design",
    description:
      "Designed robot components and assemblies in Fusion 360, bridging the gap between software requirements and physical build constraints.",
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
