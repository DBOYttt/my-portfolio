/**
 * Mock data for zero-config preview mode.
 * Replace these values with your real information before going live.
 * When DATABASE_URL is configured, the admin panel will serve real data from the DB.
 */

export const OWNER = {
  name: "Andrzej Czajkowski-Nazim",
  tagline: "Software engineer. Robotics enthusiast. Always building.",
  status: "Open to opportunities — Spring 2026",
  bio: [
    "I'm a software engineer with a solid foundation in designing, programming, and testing applications. I enjoy working at the intersection of software and hardware — from database-backed web apps to autonomous robots competing on an international stage.",
    "My background spans Python, C++ and C#, with hands-on experience in .NET, Next.js, PostgreSQL, and Linux (Ubuntu, Debian, CentOS). I automate workflows with n8n and AI agents, and have built full web applications from design to deployment.",
    "Outside of engineering I'm interested in machine learning and automation, and I explore the impact of emerging technology on everyday life.",
  ],
  email: "andrzejczn@diboy.dev",
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
    skills: [".NET", "Next.js", "Prisma", "Node.js", "Three.js"],
  },
  {
    category: "Robotics & Embedded",
    skills: ["Arduino", "WPILib", "CAD", "Fusion 360"],
  },
  {
    category: "Tools & Infrastructure",
    skills: ["Docker", "Git", "PostgreSQL", "Linux", "n8n"],
  },
  {
    category: "Machine Learning",
    skills: ["PyTorch", "scikit-learn", "Matplotlib", "model fine-tuning"],
  },
];

export const EXPERIENCE = [
  {
    company: "NewTech",
    role: "Database Administration Intern",
    period: "2021 — 2023",
    type: "Internship",
    description:
      "Created backups, optimised SQL queries, and maintained database structure consistency; collaborated with developers to design and test API interfaces.",
  },
  {
    company: "Team 9155, First Robotics Competition (FRC)",
    role: "Member & Team Captain",
    period: "2020 — 2024",
    type: "Volunteer",
    description:
      "Led a student team in designing, building, and programming competitive robots — coordinating task delegation, project planning, and contest strategy under strict deadlines.",
  },
  {
    company: "Fundacja IB Polska & Chorągiew Krakowska ZHP",
    role: "Volunteer",
    period: "2024",
    type: "Volunteer",
    description:
      "Sorted, packed, and organised relief supplies for flood victims; supported logistics and warehouse operations in a donation centre.",
  },
  {
    company: "JCC Krakow",
    role: "Volunteer",
    period: "2021 — 2022",
    type: "Volunteer",
    description:
      "Assisted in organising cultural and community events; supported seniors and Holocaust survivors through companionship programmes.",
  },
];

export const PROJECTS = [
  {
    slug: "autonomous-nav-robot",
    title: "Autonomous Navigation Robot",
    year: "2024",
    summary:
      "ROS2-based differential drive robot with custom SLAM implementation. Reduced localization error by 40% vs. baseline using particle filter tuning and a LiDAR preprocessing stage.",
    techTags: ["ROS2", "Python", "C++", "SLAM", "LiDAR", "OpenCV"],
    type: "ROBOTICS" as const,
    githubUrl: "https://github.com/DBOYttt/autonomous-nav-robot",
    liveUrl: null,
    sketchLabel: "FIG. 01 — chassis + sensor mast",
  },
  {
    slug: "automation-pipeline",
    title: "Event-Driven Automation Pipeline",
    year: "2024",
    summary:
      "Async Python pipeline handling 50k+ events/day with sub-100ms p95 latency. Built with FastAPI, PostgreSQL, and n8n for workflow orchestration.",
    techTags: ["Python", "FastAPI", "PostgreSQL", "Docker", "n8n", "Redis"],
    type: "SOFTWARE" as const,
    githubUrl: "https://github.com/DBOYttt/automation-pipeline",
    liveUrl: null,
    sketchLabel: "FIG. 02 — service topology",
  },
  {
    slug: "embedded-sensor-system",
    title: "Multi-Sensor Fusion Firmware",
    year: "2023",
    summary:
      "Real-time sensor fusion on STM32F4 aggregating IMU, GPS, and ultrasonic data at 200Hz. Custom Kalman filter implementation in bare-metal C.",
    techTags: ["C", "STM32", "FreeRTOS", "Kalman Filter", "SPI", "I2C"],
    type: "HARDWARE" as const,
    githubUrl: "https://github.com/DBOYttt/sensor-fusion",
    liveUrl: null,
    sketchLabel: "FIG. 03 — pinout & wiring",
  },
  {
    slug: "personal-platform",
    title: "Personal Portfolio Platform",
    year: "2025",
    summary:
      "Two-layer Next.js platform — public portfolio and private admin with content editor, agent orchestration, and a CV generator that drafts a tailored PDF from structured data.",
    techTags: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Claude API"],
    type: "SOFTWARE" as const,
    githubUrl: "https://github.com/DBOYttt/my-portfolio",
    liveUrl: null,
    sketchLabel: "FIG. 04 — admin / public split",
  },
];

export const ROBOTICS_HIGHLIGHTS = [
  {
    icon: "🤖",
    title: "Autonomous Systems",
    description:
      "Designing and programming autonomous robot behaviors for competition, using sensor feedback, control loops, and drive systems that react to the field in real time.",
  },
  {
    icon: "🏆",
    title: "Competition Robotics",
    description:
      "Built and competed with FRC robots under strict deadlines, coordinating mechanical, electrical, and software subsystems as team captain.",
  },
  {
    icon: "⚡",
    title: "Embedded Development",
    description:
      "Programming microcontrollers with Arduino and WPILib for real-time motor control, sensor reading, and hardware interfacing.",
  },
  {
    icon: "🔧",
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
    content: `## The Problem

Building a particle filter SLAM from scratch is one of those tasks that looks straightforward on paper but reveals layers of subtlety when you're debugging at 2am wondering why your robot thinks it drove through a wall.

I started this project for a differential-drive robot I was building as part of my robotics thesis. The robot needed to localize itself in a known map and update that map incrementally as it explored. I wanted to understand the math deeply rather than plug in an existing library.

## The Algorithm

Particle filter SLAM represents the robot's belief as a set of weighted particles. Each particle is a hypothesis about the robot's pose $(x, y, \\theta)$ and a local map estimate.

### Prediction Step

At each timestep we propagate every particle through the motion model, adding Gaussian noise to simulate odometry uncertainty:

\`\`\`cpp
void predict(Particle& p, double v, double w, double dt) {
    p.theta += w * dt;
    p.x += v * std::cos(p.theta) * dt;
    p.y += v * std::sin(p.theta) * dt;
    p.x += gaussian(0, sigma_x);
    p.y += gaussian(0, sigma_y);
    p.theta += gaussian(0, sigma_theta);
}
\`\`\`

### Update Step

When a laser scan arrives, each particle's weight is updated as the likelihood of the scan given the particle's pose and the current map. Particles with higher likelihood get more weight and survive resampling.

### Resampling

I used systematic resampling, which has O(N) complexity and lower variance than multinomial sampling. After resampling, all particle weights are reset to 1/N.

## ROS2 Integration

The hardest part was the TF2 transform tree. The \`nav_msgs/OccupancyGrid\` message needs the correct \`frame_id\`, and the transform from \`odom\` to \`map\` must be published atomically to avoid race conditions:

\`\`\`python
def publish_transform(self, pose: PoseStamped) -> None:
    t = TransformStamped()
    t.header.stamp = self.get_clock().now().to_msg()
    t.header.frame_id = 'map'
    t.child_frame_id = 'odom'
    t.transform.translation.x = pose.pose.position.x
    t.transform.translation.y = pose.pose.position.y
    self.tf_broadcaster.sendTransform(t)
\`\`\`

## Results

On a 10m × 10m test environment the filter converged to within 8cm RMS error with 500 particles running at 10Hz on a Raspberry Pi 4. CPU usage was around 40%, leaving headroom for the navigation stack.

## What I'd Do Differently

Naive systematic resampling causes particle degeneracy on long runs. Adaptive resampling — only resampling when the effective particle count drops below a threshold — would have significantly improved long-term accuracy without the extra computational cost.`,
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
