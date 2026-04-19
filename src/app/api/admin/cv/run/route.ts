export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { runCvGenerator, runCvGeneratorTargeted } from "@/lib/agents/cv-generator";

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  let body: { mode?: string; jobDescription?: string } = {};
  try {
    body = (await req.json()) as { mode?: string; jobDescription?: string };
  } catch {
    // body is optional — default to portfolio mode
  }

  const mode = body.mode === "targeted" ? "targeted" : "portfolio";
  const jobDescription = typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";

  if (mode === "targeted" && !jobDescription) {
    return NextResponse.json(
      { error: "jobDescription is required for targeted mode" },
      { status: 400 },
    );
  }

  const agent = await prisma.agent.findUnique({ where: { id: "agent-cv-generator" } });
  if (!agent) {
    return NextResponse.json(
      { error: "CV Generator agent not found. Run agents/cv-generator.ts first." },
      { status: 404 },
    );
  }

  await prisma.agent.update({
    where: { id: "agent-cv-generator" },
    data: { status: "running", lastError: null },
  });

  try {
    const result =
      mode === "targeted"
        ? await runCvGeneratorTargeted(jobDescription)
        : await runCvGenerator();

    const report = await prisma.agentReport.create({
      data: {
        agentId: agent.id,
        title: result.title,
        summary: result.summary,
        sources: result.sources,
        rawData: result.rawData as object,
      },
    });

    await prisma.agent.update({
      where: { id: "agent-cv-generator" },
      data: { status: "idle", lastRunAt: new Date() },
    });

    return NextResponse.json({ ok: true, title: result.title, rawData: result.rawData, reportId: report.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.agent.update({
      where: { id: "agent-cv-generator" },
      data: { status: "error", lastError: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
