import { writeFile } from "fs/promises";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { AgentRunResult } from "./types";
import type { CvContent } from "../cv-template";

function formatMonth(d: Date | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

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

function sanitizeCvContent(cv: CvContent): CvContent {
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

export async function runCvGenerator(): Promise<AgentRunResult> {
  const { prisma } = await import("../prisma");

  const [user, skills, experiences, projects] = await Promise.all([
    prisma.user.findFirst(),
    prisma.skill.findMany({ orderBy: { order: "asc" } }),
    prisma.experience.findMany({ orderBy: { startDate: "desc" } }),
    prisma.project.findMany({ where: { featured: true }, orderBy: { order: "asc" } }),
  ]);

  if (!user) {
    throw new Error("No user found in database. Run db:seed first.");
  }

  // Get contact links from ExternalLink table
  const externalLinks = await prisma.externalLink.findMany();
  const githubLink = externalLinks.find((l) => l.type === "GITHUB");
  const websiteLink = externalLinks.find(
    (l) => l.type === "OTHER" && l.label.toLowerCase().includes("website")
  );

  let cvContent: CvContent;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    // Build prompt data
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
        const end = exp.current
          ? "Present"
          : exp.endDate
          ? formatMonth(exp.endDate)
          : "Present";
        return `${exp.company} — ${exp.role} (${start} – ${end}): ${exp.description}`;
      })
      .join("\n");

    const projectsText = projects
      .map((p) => `${p.title} [${p.techTags.join(", ")}]: ${p.summary}`)
      .join("\n");

    const displayName = user.name ?? user.email.split("@")[0] ?? "Software Engineer";

    const prompt = `You are a professional technical CV writer. Output ONLY valid JSON — no markdown, no explanation, no preamble.

Candidate data:
Name: ${displayName}
Email: ${user.email}

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
- Banned words: passionate, synergy, results-driven, dynamic, leverage, innovative
- Banned weak verbs: helped, worked on, assisted, was involved in, participated in
- ATS format: no tables, no columns in descriptions

Return this exact JSON structure (use real data only, do not invent facts):
{"summary":"...","skills":[{"category":"Languages","items":["..."]},{"category":"Frameworks & Libraries","items":["..."]}],"experience":[{"company":"...","role":"...","period":"Jan 2021 – Present","description":"• Architected...\\n• Implemented...","type":"Full-time"}],"projects":[{"title":"...","summary":"...","tech":["..."]}],"contact":{"email":"${user.email}","github":"","website":""}}`;

    try {
      const client = new Anthropic({ apiKey });
      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const content = msg.content[0];
      const rawText = content.type === "text" ? content.text.trim() : "";

      // Strip markdown code fences if present
      const jsonText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;

      const parsedContact =
        typeof parsed.contact === "object" && parsed.contact !== null
          ? (parsed.contact as Record<string, unknown>)
          : {};

      cvContent = sanitizeCvContent({
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        contact: {
          email: user.email,
          github:
            typeof parsedContact.github === "string" && parsedContact.github
              ? parsedContact.github
              : githubLink?.url ?? undefined,
          website:
            typeof parsedContact.website === "string" && parsedContact.website
              ? parsedContact.website
              : websiteLink?.url ?? undefined,
        },
      });
    } catch {
      // Fall back to raw DB data if parse fails
      cvContent = buildCvFromRaw({
        email: user.email,
        name: user.name,
        skills,
        experience: experiences.map((e) => ({
          company: e.company,
          role: e.role,
          startDate: e.startDate,
          endDate: e.endDate,
          current: e.current,
          description: e.description,
          type: e.type,
        })),
        projects,
        github: githubLink?.url,
        website: websiteLink?.url,
      });
    }
  } else {
    // No API key — build from raw DB rows
    cvContent = buildCvFromRaw({
      email: user.email,
      name: user.name,
      skills,
      experience: experiences.map((e) => ({
        company: e.company,
        role: e.role,
        startDate: e.startDate,
        endDate: e.endDate,
        current: e.current,
        description: e.description,
        type: e.type,
      })),
      projects,
      github: githubLink?.url,
      website: websiteLink?.url,
    });
  }

  // Render PDF
  const { renderCvToPdf } = await import("../cv-template");
  const pdfBuffer = await renderCvToPdf(cvContent);

  // Write to public/cv.pdf
  const outputPath = path.join(process.cwd(), "public", "cv.pdf");
  await writeFile(outputPath, pdfBuffer);

  // Persist cvContent to User record
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

  const summary = `CV generated with ${skills.length} skill${skills.length !== 1 ? "s" : ""}, ${experiences.length} experience entr${experiences.length !== 1 ? "ies" : "y"}, ${projects.length} project${projects.length !== 1 ? "s" : ""}.`;

  return {
    title,
    summary,
    sources: [],
    rawData: cvContent,
  };
}
