import { prisma } from "@/lib/prisma";
import type { AgentRunResult } from "./types";
import type { AgentType } from "@prisma/client";

export interface AgentDefinition {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  schedule: string;
  config?: Record<string, unknown>;
}

export async function runAgent(
  def: AgentDefinition,
  runner: () => Promise<AgentRunResult>
): Promise<void> {
  console.log(`[${def.id}] Starting...`);

  const agent = await prisma.agent.upsert({
    where: { id: def.id },
    update: { lastRunAt: new Date(), status: "idle" },
    create: {
      id: def.id,
      name: def.name,
      type: def.type,
      description: def.description,
      enabled: true,
      schedule: def.schedule,
      config: def.config ?? {},
      lastRunAt: new Date(),
    },
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
    if (result._updatedConfig) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { config: result._updatedConfig as object },
      });
    }
    console.log(`[${def.id}] Report saved: ${result.title}`);
  } finally {
    await prisma.$disconnect();
  }
}
