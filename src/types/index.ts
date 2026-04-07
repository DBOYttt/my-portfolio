export interface ProjectSummary {
  slug: string;
  title: string;
  summary: string;
  techTags: string[];
  type: "ROBOTICS" | "SOFTWARE" | "HARDWARE" | "RESEARCH";
  githubUrl: string | null;
  liveUrl: string | null;
}

export interface ProjectDetail extends ProjectSummary {
  content: string;
  coverImage: string | null;
  featured: boolean;
  publishedAt: Date | null;
}

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  type: string;
  description: string;
}

export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  seoTitle: string | null;
  seoDesc: string | null;
  publishedAt: Date | null;
}
