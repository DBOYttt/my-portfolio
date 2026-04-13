export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { runCvGenerator } from "@/lib/agents/cv-generator";

export async function POST() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const agent = await prisma.agent.findUnique({ where: { id: "agent-cv-generator" } });
  if (!agent) {
    return NextResponse.json({ error: "CV Generator agent not found. Run agents/cv-generator.ts first." }, { status: 404 });
  }

  await prisma.agent.update({
    where: { id: "agent-cv-generator" },
    data: { status: "running", lastError: null },
  });

  try {
    const result = await runCvGenerator();

    await prisma.agentReport.create({
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

    return NextResponse.json({ ok: true, title: result.title });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.agent.update({
      where: { id: "agent-cv-generator" },
      data: { status: "error", lastError: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
