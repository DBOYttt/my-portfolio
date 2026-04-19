import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { AGENT_RUNNERS } from "@/lib/agents";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const agent = await prisma.agent.findUnique({ where: { id: params.id } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  if (!agent.enabled) return NextResponse.json({ error: "Agent is disabled" }, { status: 400 });

  const runner = AGENT_RUNNERS[agent.type];
  if (!runner) return NextResponse.json({ error: "No runner for this agent type" }, { status: 400 });

  // Atomic claim: only one concurrent request can win this UPDATE
  const claimed = await prisma.agent.updateMany({
    where: { id: params.id, status: { not: "running" } },
    data: { status: "running", lastError: null },
  });
  if (claimed.count === 0) {
    return NextResponse.json({ error: "Agent is already running" }, { status: 409 });
  }

  try {
    const result = await runner();
    const report = await prisma.agentReport.create({
      data: {
        agentId: agent.id,
        title: result.title,
        summary: result.summary,
        sources: result.sources,
        rawData: result.rawData as object,
      },
    });
    // Persist updated config (e.g. seenUrls for deduplication) if the runner returned one
    const agentUpdateData: Record<string, unknown> = { status: "idle", lastRunAt: new Date() };
    if (result._updatedConfig) {
      agentUpdateData.config = result._updatedConfig;
    }
    await prisma.agent.update({
      where: { id: params.id },
      data: agentUpdateData,
    });
    return NextResponse.json({ ok: true, title: result.title, rawData: result.rawData, reportId: report.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.agent.update({
      where: { id: params.id },
      data: { status: "error", lastError: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
