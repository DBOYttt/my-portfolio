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

  await prisma.agent.update({
    where: { id: params.id },
    data: { status: "running", lastError: null },
  });

  try {
    const result = await runner();
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
      where: { id: params.id },
      data: { status: "idle", lastRunAt: new Date() },
    });
    return NextResponse.json({ ok: true, title: result.title });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.agent.update({
      where: { id: params.id },
      data: { status: "error", lastError: msg },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
