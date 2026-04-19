import { writeFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";
import type { CvContent } from "../cv-template";

export function formatMonth(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface AtsKeywordGap {
  present: string[];
  absent: string[];
}

export interface TargetedVariants {
  robotics: CvContent;
  software: CvContent;
}

export interface TargetedRawData {
  type: "CV_TARGETED";
  portfolio: CvContent;
  variants: TargetedVariants;
  targetedPdfPaths: { robotics: string; software: string };
  atsKeywordGap: AtsKeywordGap;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function buildCvFromRaw(params: {
  email: string;
  name: string | null;
  skills: { name: string; category: string }[];
  experience: {
    company: string;
    role: string;
    startDate: Date;
    endDate: Date | null;
    current: boolean;
    description: string;
    type: string;
  }[];
  projects: { title: string; summary: string; techTags: string[] }[];
  github?: string;
  website?: string;
}): CvContent {
  const categoryMap: Record<string, string> = {
    LANGUAGES: "Languages",
    FRAMEWORKS: "Frameworks & Libraries",
    DATABASES: "Databases",
    TOOLS: "Tools & Platforms",
    CONCEPTS: "Concepts",
  };

  const skillMap = new Map<string, string[]>();
  for (const skill of params.skills) {
    const cat = categoryMap[skill.category] ?? (skill.category.charAt(0) + skill.category.slice(1).toLowerCase());
    const existing = skillMap.get(cat) ?? [];
    existing.push(skill.name);
    skillMap.set(cat, existing);
  }

  const skills = Array.from(skillMap.entries()).map(([category, items]) => ({
    category,
    items,
  }));

  const experience = params.experience.map((exp) => {
    const start = formatMonth(exp.startDate);
    const end = exp.current
      ? "Present"
      : exp.endDate
      ? formatMonth(exp.endDate)
      : "Present";
    const typeLabel =
      exp.type === "FULLTIME"
        ? "Full-time"
        : exp.type === "PARTTIME"
        ? "Part-time"
        : exp.type === "CONTRACT"
        ? "Contract"
        : exp.type === "INTERNSHIP"
        ? "Internship"
        : exp.type === "VOLUNTEER"
        ? "Volunteer"
        : exp.type;

    return {
      company: exp.company,
      role: exp.role,
      period: `${start} – ${end}`,
      description: exp.description,
      type: typeLabel,
    };
  });

  const projects = params.projects.map((proj) => ({
    title: proj.title,
    summary: proj.summary,
    tech: proj.techTags,
  }));

  const displayName = params.name ?? params.email.split("@")[0] ?? "Software Engineer";
  const topSkills = params.skills.slice(0, 5).map((s) => s.name).join(", ");
  const latestRole =
    params.experience.length > 0
      ? `${params.experience[0].role} at ${params.experience[0].company}`
      : "software engineering";
  const summary = `${displayName} is a software engineer with hands-on experience in ${topSkills || "full-stack development, embedded systems, and automation"}. Currently working as ${latestRole}. Builds end-to-end solutions across backend, frontend, and infrastructure.`;

  return {
    summary,
    skills,
    experience,
    projects,
    contact: {
      email: params.email,
      github: params.github,
      website: params.website,
    },
  };
}

export function sanitizeCvContent(cv: CvContent): CvContent {
  const replacements: [RegExp, string][] = [
    [/\bpassionate(ly)?\b/gi, ""],
    [/\bsynergy\b/gi, ""],
    [/\bresults-driven\b/gi, ""],
    [/\bdynamic\b/gi, ""],
    [/\b(helped|was helping)\b/gi, "contributed to"],
    [/\bworked on\b/gi, "developed"],
    [/\bassisted( with)?\b/gi, "supported"],
    [/\bwas involved in\b/gi, "implemented"],
    [/\bparticipated in\b/gi, "contributed to"],
  ];

  function clean(text: string): string {
    let result = text;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }
    return result.replace(/\s{2,}/g, " ").trim();
  }

  return {
    ...cv,
    summary: clean(cv.summary),
    experience: cv.experience.map((exp) => ({ ...exp, description: clean(exp.description) })),
  };
}

/** Extract unique lowercase words ≥4 chars from a JD string. */
function extractJdKeywords(jdText: string): string[] {
  const words = jdText
    .toLowerCase()
    .split(/[\s,./;:()\[\]{}<>!"'`|\\@#$%^&*+=~]+/)
    .filter((w) => w.length >= 4);
  return [...new Set(words)];
}

/** Compute ATS keyword gap between JD keywords and CV text. */
function computeAtsGap(jdText: string, cvText: string): AtsKeywordGap {
  const keywords = extractJdKeywords(jdText);
  const cvLower = cvText.toLowerCase();
  const present: string[] = [];
  const absent: string[] = [];
  for (const kw of keywords) {
    if (cvLower.includes(kw)) {
      present.push(kw);
    } else {
      absent.push(kw);
    }
  }
  return { present, absent };
}

/** Flatten a CvContent into a plain string for keyword matching. */
function cvContentToText(cv: CvContent): string {
  const parts: string[] = [cv.summary];
  for (const sg of cv.skills) {
    parts.push(sg.category, sg.items.join(" "));
  }
  for (const exp of cv.experience) {
    parts.push(exp.company, exp.role, exp.description, exp.type);
  }
  for (const proj of cv.projects) {
    parts.push(proj.title, proj.summary, proj.tech.join(" "));
  }
  parts.push(cv.contact.email);
  if (cv.contact.github) parts.push(cv.contact.github);
  if (cv.contact.website) parts.push(cv.contact.website);
  return parts.join(" ");
}

/** Parse a single CvContent object from parsed JSON record, with safe fallbacks. */
function parseCvContentRecord(
  parsed: Record<string, unknown>,
  email: string,
  github: string | undefined,
  website: string | undefined,
): CvContent {
  const parsedContact =
    typeof parsed.contact === "object" && parsed.contact !== null
      ? (parsed.contact as Record<string, unknown>)
      : {};

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    skills: Array.isArray(parsed.skills) ? (parsed.skills as CvContent["skills"]) : [],
    experience: Array.isArray(parsed.experience) ? (parsed.experience as CvContent["experience"]) : [],
    projects: Array.isArray(parsed.projects) ? (parsed.projects as CvContent["projects"]) : [],
    contact: {
      email,
      github:
        typeof parsedContact.github === "string" && parsedContact.github
          ? parsedContact.github
          : github,
      website:
        typeof parsedContact.website === "string" && parsedContact.website
          ? parsedContact.website
          : website,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared DB data loader
// ──────────────────────────────────────────────────────────────────────────────

interface DbCvData {
  user: { id: string; email: string; name: string | null };
  skills: { name: string; category: string }[];
  experiences: {
    company: string;
    role: string;
    startDate: Date;
    endDate: Date | null;
    current: boolean;
    description: string;
    type: string;
  }[];
  projects: { title: string; summary: string; techTags: string[] }[];
  githubLink: string | undefined;
  websiteLink: string | undefined;
}

async function loadDbCvData(): Promise<DbCvData> {
  const { prisma } = await import("../prisma");

  const [user, skills, experiences, projects, externalLinks] = await Promise.all([
    prisma.user.findFirst(),
    prisma.skill.findMany({ orderBy: { order: "asc" } }),
    prisma.experience.findMany({ orderBy: { startDate: "desc" } }),
    prisma.project.findMany({ where: { featured: true }, orderBy: { order: "asc" } }),
    prisma.externalLink.findMany(),
  ]);

  if (!user) {
    throw new Error("No user found in database. Run db:seed first.");
  }

  const githubLink = externalLinks.find((l) => l.type === "GITHUB")?.url;
  const websiteLink = externalLinks.find(
    (l) => l.type === "OTHER" && l.label.toLowerCase().includes("website"),
  )?.url;

  return {
    user,
    skills,
    experiences: experiences.map((e) => ({
      company: e.company,
      role: e.role,
      startDate: e.startDate,
      endDate: e.endDate,
      current: e.current,
      description: e.description,
      type: e.type,
    })),
    projects,
    githubLink,
    websiteLink,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Prompt builders
// ──────────────────────────────────────────────────────────────────────────────

function buildPortfolioPrompt(data: DbCvData): string {
  const { user, skills, experiences, projects, githubLink, websiteLink } = data;

  const skillsByCategory = new Map<string, string[]>();
  for (const skill of skills) {
    const existing = skillsByCategory.get(skill.category) ?? [];
    existing.push(skill.name);
    skillsByCategory.set(skill.category, existing);
  }
  const skillsText = Array.from(skillsByCategory.entries())
    .map(([cat, items]) => `${cat}: ${items.join(", ")}`)
    .join("\n");

  const experienceText = experiences
    .map((exp) => {
      const start = formatMonth(exp.startDate);
      const end = exp.current ? "Present" : exp.endDate ? formatMonth(exp.endDate) : "Present";
      return `${exp.company} — ${exp.role} (${start} – ${end}): ${exp.description}`;
    })
    .join("\n");

  const projectsText = projects
    .map((p) => `${p.title} [${p.techTags.join(", ")}]: ${p.summary}`)
    .join("\n");

  const displayName = user.name ?? user.email.split("@")[0] ?? "Software Engineer";

  return `You are a professional technical CV writer. Output ONLY valid JSON — no markdown, no explanation, no preamble.

Candidate data:
Name: ${displayName}
Email: ${user.email}
${githubLink ? `GitHub: ${githubLink}` : ""}
${websiteLink ? `Website: ${websiteLink}` : ""}

Skills by category:
${skillsText}

Experience (most recent first):
${experienceText}

Featured Projects:
${projectsText}

Rules:
- Use strong action verbs: Architected, Implemented, Shipped, Migrated, Automated, Optimised, Reduced, Built, Designed, Integrated
- Skill categories MUST be exactly: "Languages", "Frameworks & Libraries", "Databases", "Tools & Platforms", "Concepts"
- Experience descriptions: use bullet-point format with \\n• prefix for each bullet (2-4 bullets per role)
- Summary: 2-3 sentences, technical tone, mention top 3 skills and current/most recent role, NO fluff
- Highlight the unique robotics + software mix to impress a general technical audience
- Banned words: passionate, synergy, results-driven, dynamic, leverage, innovative
- Banned weak verbs: helped, worked on, assisted, was involved in, participated in
- ATS format: no tables, no columns in descriptions

Return this exact JSON structure (use real data only, do not invent facts):
{"summary":"...","skills":[{"category":"Languages","items":["..."]},{"category":"Frameworks & Libraries","items":["..."]}],"experience":[{"company":"...","role":"...","period":"Jan 2021 – Present","description":"• Architected...\\n• Implemented...","type":"Full-time"}],"projects":[{"title":"...","summary":"...","tech":["..."]}],"contact":{"email":"${user.email}","github":"${githubLink ?? ""}","website":"${websiteLink ?? ""}"}}`;
}

function buildTargetedPrompt(data: DbCvData, jobDescription: string): string {
  const { user, skills, experiences, projects, githubLink, websiteLink } = data;

  const skillsByCategory = new Map<string, string[]>();
  for (const skill of skills) {
    const existing = skillsByCategory.get(skill.category) ?? [];
    existing.push(skill.name);
    skillsByCategory.set(skill.category, existing);
  }
  const skillsText = Array.from(skillsByCategory.entries())
    .map(([cat, items]) => `${cat}: ${items.join(", ")}`)
    .join("\n");

  const experienceText = experiences
    .map((exp) => {
      const start = formatMonth(exp.startDate);
      const end = exp.current ? "Present" : exp.endDate ? formatMonth(exp.endDate) : "Present";
      return `${exp.company} — ${exp.role} (${start} – ${end}): ${exp.description}`;
    })
    .join("\n");

  const projectsText = projects
    .map((p) => `${p.title} [${p.techTags.join(", ")}]: ${p.summary}`)
    .join("\n");

  const displayName = user.name ?? user.email.split("@")[0] ?? "Software Engineer";

  return `You are a professional technical CV writer specialising in ATS-optimised resumes. Output ONLY valid JSON — no markdown, no explanation, no preamble.

Candidate data:
Name: ${displayName}
Email: ${user.email}
${githubLink ? `GitHub: ${githubLink}` : ""}
${websiteLink ? `Website: ${websiteLink}` : ""}

Skills by category:
${skillsText}

Experience (most recent first):
${experienceText}

Featured Projects:
${projectsText}

Job Description:
${jobDescription}

Task:
Generate TWO tailored CV variants for the job description above. Both must remain 100% truthful — rewrite bullet points and summary to match JD keywords and priorities but never invent facts.

Variant 1 — "robotics": leads with embedded systems / ROS / hardware experience; puts Languages and Concepts first in Skills.
Variant 2 — "software": leads with full-stack / backend experience; puts Frameworks & Libraries and Databases first in Skills.

Rules for both variants:
- Use strong action verbs: Architected, Implemented, Shipped, Migrated, Automated, Optimised, Reduced, Built, Designed, Integrated
- Skill categories MUST be exactly: "Languages", "Frameworks & Libraries", "Databases", "Tools & Platforms", "Concepts"
- Experience descriptions: use bullet-point format with \\n• prefix for each bullet (2-4 bullets per role)
- Summary: 2-3 sentences, technical tone, mirror JD keywords naturally, NO fluff
- Banned words: passionate, synergy, results-driven, dynamic, leverage, innovative
- Banned weak verbs: helped, worked on, assisted, was involved in, participated in
- ATS format: no tables, no columns in descriptions

Return this exact JSON structure:
{
  "robotics": {"summary":"...","skills":[{"category":"Languages","items":["..."]}],"experience":[{"company":"...","role":"...","period":"Jan 2021 – Present","description":"• Architected...\\n• Implemented...","type":"Full-time"}],"projects":[{"title":"...","summary":"...","tech":["..."]}],"contact":{"email":"${user.email}","github":"${githubLink ?? ""}","website":"${websiteLink ?? ""}"}},
  "software": {"summary":"...","skills":[{"category":"Frameworks & Libraries","items":["..."]}],"experience":[{"company":"...","role":"...","period":"Jan 2021 – Present","description":"• Architected...\\n• Implemented...","type":"Full-time"}],"projects":[{"title":"...","summary":"...","tech":["..."]}],"contact":{"email":"${user.email}","github":"${githubLink ?? ""}","website":"${websiteLink ?? ""}"}}
}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// CV-A: Portfolio mode runner (default — overwrites public/cv.pdf)
// ──────────────────────────────────────────────────────────────────────────────

export async function runCvGenerator(): Promise<AgentRunResult> {
  const { prisma } = await import("../prisma");
  const data = await loadDbCvData();
  const { user, skills, experiences, projects, githubLink, websiteLink } = data;

  let cvContent: CvContent;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    const prompt = buildPortfolioPrompt(data);

    try {
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      });

      const content = msg.content[0];
      const rawText = content.type === "text" ? content.text.trim() : "";
      const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;

      cvContent = sanitizeCvContent(
        parseCvContentRecord(parsed, user.email, githubLink, websiteLink),
      );
    } catch {
      cvContent = buildCvFromRaw({
        email: user.email,
        name: user.name,
        skills,
        experience: experiences,
        projects,
        github: githubLink,
        website: websiteLink,
      });
    }
  } else {
    cvContent = buildCvFromRaw({
      email: user.email,
      name: user.name,
      skills,
      experience: experiences,
      projects,
      github: githubLink,
      website: websiteLink,
    });
  }

  const { renderCvToPdf } = await import("../cv-template");
  const pdfBuffer = await renderCvToPdf(cvContent);

  const outputPath = path.join(process.cwd(), "public", "cv.pdf");
  await writeFile(outputPath, pdfBuffer);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      cvContent: cvContent as object,
      cvGeneratedAt: new Date(),
      cvSource: "generated",
    },
  });

  const title = `CV — Generated ${new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;

  const summary = `Portfolio CV generated with ${skills.length} skill${skills.length !== 1 ? "s" : ""}, ${experiences.length} experience entr${experiences.length !== 1 ? "ies" : "y"}, ${projects.length} project${projects.length !== 1 ? "s" : ""}. Written by claude-sonnet-4-6.`;

  return {
    title,
    summary,
    sources: [],
    rawData: cvContent,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// CV-B/CV-C/CV-E/CV-F: Targeted mode runner (never overwrites portfolio CV)
// ──────────────────────────────────────────────────────────────────────────────

export async function runCvGeneratorTargeted(jobDescription: string): Promise<AgentRunResult> {
  const data = await loadDbCvData();
  const { user, skills, experiences, projects, githubLink, websiteLink } = data;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const ts = Date.now();

  let roboticsVariant: CvContent;
  let softwareVariant: CvContent;

  if (apiKey) {
    const prompt = buildTargetedPrompt(data, jobDescription);

    try {
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      });

      const content = msg.content[0];
      const rawText = content.type === "text" ? content.text.trim() : "";
      const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;

      const roboticsRaw =
        typeof parsed.robotics === "object" && parsed.robotics !== null
          ? (parsed.robotics as Record<string, unknown>)
          : {};
      const softwareRaw =
        typeof parsed.software === "object" && parsed.software !== null
          ? (parsed.software as Record<string, unknown>)
          : {};

      roboticsVariant = sanitizeCvContent(
        parseCvContentRecord(roboticsRaw, user.email, githubLink, websiteLink),
      );
      softwareVariant = sanitizeCvContent(
        parseCvContentRecord(softwareRaw, user.email, githubLink, websiteLink),
      );
    } catch {
      // Fall back to raw DB build for both variants
      const fallback = buildCvFromRaw({
        email: user.email,
        name: user.name,
        skills,
        experience: experiences,
        projects,
        github: githubLink,
        website: websiteLink,
      });
      roboticsVariant = fallback;
      softwareVariant = fallback;
    }
  } else {
    const fallback = buildCvFromRaw({
      email: user.email,
      name: user.name,
      skills,
      experience: experiences,
      projects,
      github: githubLink,
      website: websiteLink,
    });
    roboticsVariant = fallback;
    softwareVariant = fallback;
  }

  const { renderCvToPdf } = await import("../cv-template");

  const [roboticsPdfBuffer, softwarePdfBuffer] = await Promise.all([
    renderCvToPdf(roboticsVariant),
    renderCvToPdf(softwareVariant),
  ]);

  const roboticsFilename = `cv-targeted-robotics-${ts}.pdf`;
  const softwareFilename = `cv-targeted-software-${ts}.pdf`;

  const roboticsOutputPath = path.join(process.cwd(), "public", roboticsFilename);
  const softwareOutputPath = path.join(process.cwd(), "public", softwareFilename);

  await Promise.all([
    writeFile(roboticsOutputPath, roboticsPdfBuffer),
    writeFile(softwareOutputPath, softwarePdfBuffer),
  ]);

  // CV-F: ATS keyword gap (against robotics variant as primary)
  const roboticsText = cvContentToText(roboticsVariant);
  const softwareText = cvContentToText(softwareVariant);
  const combinedCvText = `${roboticsText} ${softwareText}`;
  const atsKeywordGap = computeAtsGap(jobDescription, combinedCvText);

  const title = `Targeted CV — ${new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;

  const summary = `Targeted CV generated with 2 variants (robotics-heavy, software-heavy). ${atsKeywordGap.present.length} JD keywords covered, ${atsKeywordGap.absent.length} missing.`;

  const rawData: TargetedRawData = {
    type: "CV_TARGETED",
    portfolio: roboticsVariant,
    variants: {
      robotics: roboticsVariant,
      software: softwareVariant,
    },
    targetedPdfPaths: {
      robotics: `/${roboticsFilename}`,
      software: `/${softwareFilename}`,
    },
    atsKeywordGap,
  };

  return {
    title,
    summary,
    sources: [],
    rawData,
  };
}
