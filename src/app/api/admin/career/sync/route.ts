export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { OWNER } from "@/lib/mock-data";

interface CareerConfigData {
  contact?: { phone?: string; location?: string; twitter?: string };
  target_roles?: {
    primary?: string[];
    archetypes?: Array<{ name: string; level: string; fit: string }>;
  };
  narrative?: { headline?: string; exit_story?: string; superpowers?: string[] };
  compensation?: {
    target_range?: string;
    currency?: string;
    minimum?: string;
    location_flexibility?: string;
  };
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
    visa_status?: string;
  };
  cv_output_format?: string;
}

interface SyncResponse {
  ok: boolean;
  profileFields?: string[];
  error?: string;
}

export async function POST(): Promise<NextResponse<SyncResponse>> {
  const { error } = await requireAdminSession();
  if (error) return error as NextResponse<SyncResponse>;

  const internalUrl = process.env.CAREER_OPS_INTERNAL_URL;
  if (!internalUrl) {
    return NextResponse.json(
      { ok: false, error: "CAREER_OPS_INTERNAL_URL is not configured" },
      { status: 503 }
    );
  }

  const [user, skills, experiences, projects, links] = await Promise.all([
    prisma.user.findFirst(),
    prisma.skill.findMany({ orderBy: { order: "asc" } }),
    prisma.experience.findMany({ orderBy: { order: "asc" } }),
    prisma.project.findMany({
      where: { publishedAt: { not: null } },
      orderBy: { order: "asc" },
    }),
    prisma.externalLink.findMany({ orderBy: { order: "asc" } }),
  ]);

  const cfg = (user?.careerConfig as CareerConfigData | null) ?? {};

  const githubLink = links.find((l) => l.type === "GITHUB")?.url ?? OWNER.github;
  const linkedinLink = links.find((l) => l.type === "LINKEDIN")?.url ?? OWNER.linkedin;
  const twitterLink =
    links.find((l) => l.type === "TWITTER")?.url ?? cfg.contact?.twitter;

  const profile = {
    candidate: {
      full_name: user?.name ?? OWNER.name,
      email: user?.email ?? OWNER.email,
      phone: cfg.contact?.phone ?? "",
      location: cfg.contact?.location ?? OWNER.location,
      linkedin: linkedinLink ?? "",
      portfolio_url: "",
      github: githubLink ?? "",
      ...(twitterLink ? { twitter: twitterLink } : {}),
    },
    target_roles: cfg.target_roles ?? { primary: [], archetypes: [] },
    narrative: {
      headline: cfg.narrative?.headline ?? "",
      exit_story: cfg.narrative?.exit_story ?? "",
      superpowers: cfg.narrative?.superpowers ?? [],
      proof_points: projects
        .filter((p) => p.githubUrl !== null || p.liveUrl !== null)
        .slice(0, 5)
        .map((p) => ({
          name: p.title,
          url: p.githubUrl ?? p.liveUrl ?? "",
          hero_metric: "",
        })),
    },
    compensation: cfg.compensation ?? {
      target_range: "",
      currency: "USD",
      minimum: "",
      location_flexibility: "",
    },
    location: {
      country: cfg.location?.country ?? "",
      city: cfg.location?.city ?? OWNER.location.split(",")[0]?.trim() ?? "",
      timezone: cfg.location?.timezone ?? "",
      visa_status: cfg.location?.visa_status ?? "",
    },
    cv: { output_format: cfg.cv_output_format ?? "html" },
  };

  const skillsByCategory = skills.reduce<Record<string, string[]>>((acc, s) => {
    const cat = s.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {});

  const formatDate = (d: Date | null): string =>
    d
      ? d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      : "Present";

  const cvLines: string[] = [
    `# ${user?.name ?? OWNER.name}`,
    ``,
    `${user?.email ?? OWNER.email}${linkedinLink ? ` | ${linkedinLink}` : ""}${githubLink ? ` | ${githubLink}` : ""}`,
    `${cfg.contact?.location ?? OWNER.location}`,
    ``,
    `## Summary`,
    ``,
    cfg.narrative?.headline ? cfg.narrative.headline : (OWNER.bio[0] ?? ""),
    ``,
    `## Experience`,
    ``,
    ...experiences.flatMap((e) => [
      `### ${e.role} — ${e.company}`,
      `*${formatDate(e.startDate)} – ${e.current ? "Present" : formatDate(e.endDate ?? null)}${e.location ? ` · ${e.location}` : ""}*`,
      ``,
      e.description,
      ``,
    ]),
    `## Projects`,
    ``,
    ...projects
      .flatMap((p) => [
        `### ${p.title}${p.year ? ` (${p.year})` : ""}`,
        p.techTags.length > 0 ? `*${p.techTags.join(", ")}*` : "",
        ``,
        p.summary,
        p.githubUrl ? `GitHub: ${p.githubUrl}` : "",
        p.liveUrl ? `Live: ${p.liveUrl}` : "",
        ``,
      ])
      .filter((l) => l !== ""),
    `## Skills`,
    ``,
    ...Object.entries(skillsByCategory).map(
      ([cat, items]) => `**${cat}:** ${items.join(", ")}`
    ),
    ``,
  ];

  const cv = cvLines.join("\n");

  const secret = process.env.CAREER_OPS_INTERNAL_SECRET;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secret) headers["Authorization"] = `Bearer ${secret}`;

  let syncRes: Response;
  try {
    syncRes = await fetch(`${internalUrl}/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({ profile, cv }),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json(
      { ok: false, error: `career-ops unreachable: ${message}` },
      { status: 502 }
    );
  }

  if (!syncRes.ok) {
    const text = await syncRes.text().catch(() => "");
    return NextResponse.json(
      { ok: false, error: `career-ops returned ${syncRes.status}: ${text}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, profileFields: Object.keys(profile.candidate) });
}
