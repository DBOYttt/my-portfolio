import type {
  GoogleAlertItem,
  GithubRepoStat,
  DevToMention,
} from "@/lib/agents/brand-monitor";
import type { BlogSuggestion, BlogSeries } from "@/lib/agents/blog-suggester";

// ─── Type guard ───────────────────────────────────────────────────────────────

/** Returns true when `v` is a plain object (not null, not array). */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ─── Skills Inference ────────────────────────────────────────────────────────

type SkillCategory = "LANGUAGE" | "FRAMEWORK" | "TOOL" | "ROBOTICS" | "EMBEDDED" | "DATABASE" | "OTHER";
type SkillLevel = "FAMILIAR" | "PROFICIENT" | "EXPERT";

export interface SkillAddSuggestion {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  evidence: string;
}

export interface SkillUpgradeSuggestion {
  name: string;
  currentLevel: string;
  suggestedLevel: string;
  evidence: string;
}

export interface SkillStaleSuggestion {
  name: string;
  reason: string;
}

export interface SkillsDiffRawData {
  type: "SKILLS_DIFF";
  add: SkillAddSuggestion[];
  upgrade: SkillUpgradeSuggestion[];
  stale: SkillStaleSuggestion[];
}

// ─── GitHub Project Importer ─────────────────────────────────────────────────

export interface ProjectSuggestion {
  title: string;
  slug: string;
  summary: string;
  content: string;
  type: "SOFTWARE" | "ROBOTICS" | "HARDWARE" | "RESEARCH";
  techTags: string[];
  githubUrl: string;
}

export interface ProjectSuggestionsRawData {
  type: "PROJECT_SUGGESTIONS";
  suggestions: ProjectSuggestion[];
  existingCount: number;
}

export interface CreatedProject {
  id: string;
  title: string;
  slug: string;
  type: string;
  githubUrl: string;
  readmeScore?: number;
  readmeNote?: string | null;
}

export interface ProjectCreatedRawData {
  type: "PROJECT_CREATED";
  created: CreatedProject[];
  skipped: number;
}

// ─── Brand Monitor ───────────────────────────────────────────────────────────

export interface BrandMonitorRawData {
  githubDelta: GithubRepoStat[];
  googleAlerts: GoogleAlertItem[];
  devToMentions: DevToMention[];
}

// ─── Blog Suggester ──────────────────────────────────────────────────────────

export interface BlogSuggesterRawData {
  suggestions: BlogSuggestion[];
  series?: BlogSeries[];
  existingTopics: number;
}
