import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AgentRunResult } from "@/lib/agents/types";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    agent: {
      upsert: vi.fn().mockResolvedValue({ id: "agent-test" }),
      update: vi.fn().mockResolvedValue({}),
    },
    agentReport: {
      create: vi.fn().mockResolvedValue({}),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("runAgent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts the agent record, creates a report, and disconnects", async () => {
    const { runAgent } = await import("../run-agent");
    const { prisma } = await import("@/lib/prisma");

    const mockResult: AgentRunResult = {
      title: "Test Report",
      summary: "Summary",
      sources: [],
      rawData: {},
    };

    await runAgent(
      {
        id: "agent-test",
        name: "Test Agent",
        type: "GITHUB_SUMMARIZER",
        description: "A test agent",
        schedule: "0 9 * * 1",
      },
      async () => mockResult
    );

    expect(prisma.agent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "agent-test" },
        create: expect.objectContaining({ id: "agent-test", name: "Test Agent" }),
      })
    );

    expect(prisma.agentReport.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          agentId: "agent-test",
          title: "Test Report",
        }),
      })
    );

    expect(prisma.$disconnect).toHaveBeenCalledOnce();
  });

  it("marks the agent status=error with lastError and rethrows when runner throws", async () => {
    const { runAgent } = await import("../run-agent");
    const { prisma } = await import("@/lib/prisma");

    await expect(
      runAgent(
        { id: "agent-test", name: "Test", type: "GITHUB_SUMMARIZER", description: "", schedule: "" },
        async () => { throw new Error("runner failed"); }
      )
    ).rejects.toThrow("runner failed");

    expect(prisma.agent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "agent-test" },
        data: { status: "error", lastError: "runner failed" },
      })
    );
    expect(prisma.$disconnect).toHaveBeenCalledOnce();
  });

  it("sets status=idle on success and persists _updatedConfig when runner returns it", async () => {
    const { runAgent } = await import("../run-agent");
    const { prisma } = await import("@/lib/prisma");

    const mockResult: AgentRunResult = {
      title: "Test",
      summary: "Summary",
      sources: [],
      rawData: {},
      _updatedConfig: { seenUrls: ["https://example.com"] },
    };

    await runAgent(
      { id: "agent-test", name: "Test", type: "GITHUB_SUMMARIZER", description: "", schedule: "" },
      async () => mockResult
    );

    expect(prisma.agent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "agent-test" },
        data: { status: "idle", config: { seenUrls: ["https://example.com"] } },
      })
    );
  });

  it("marks status=running on the upsert before running the runner", async () => {
    const { runAgent } = await import("../run-agent");
    const { prisma } = await import("@/lib/prisma");

    await runAgent(
      { id: "agent-test", name: "Test", type: "GITHUB_SUMMARIZER", description: "", schedule: "" },
      async () => ({ title: "t", summary: "s", sources: [], rawData: {} }),
    );

    expect(prisma.agent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { lastRunAt: expect.any(Date), status: "running", lastError: null },
      })
    );
  });
});
