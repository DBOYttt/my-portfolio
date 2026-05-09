// CV template removed — superseded by career-ops service (M7.5).

export interface CvContent {
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: {
    company: string;
    role: string;
    period: string;
    description: string;
    type: string;
  }[];
  projects: { title: string; summary: string; tech: string[] }[];
  contact: { email: string; github?: string; website?: string; yearsOfExperience?: number };
}
