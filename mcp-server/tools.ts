import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";
import { prisma } from "../src/lib/prisma";
import { AGENT_RUNNERS } from "../src/lib/agents/index";
import { AgentType } from "@prisma/client";
import { slugify } from "./slugify";

export function registerTools(server: McpServer): void {
  server.tool(
    "create_post",
    "Create a new blog post",
    {
      title: z.string(),
      content: z.string(),
      excerpt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("DRAFT"),
    },
    async ({ title, content, excerpt, tags, status }) => {
      const slug = slugify(title);
      const tagRecords = await Promise.all(
        (tags ?? []).map((name) =>
          prisma.tag.upsert({ where: { name }, update: {}, create: { name, slug: slugify(name) } })
        )
      );
      const post = await prisma.post.create({
        data: {
          title,
          slug,
          content,
          excerpt,
          status,
          publishedAt: status === "PUBLISHED" ? new Date() : null,
          tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
        },
      });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", metadata: { tool: "create_post", slug } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: post.id, slug: post.slug }) }] };
    }
  );

  server.tool(
    "update_post",
    "Update an existing blog post by slug",
    {
      slug: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      excerpt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(["DRAFT", "PUBLISHED", "SCHEDULED"]).optional(),
    },
    async ({ slug, title, content, excerpt, tags, status }) => {
      const existing = await prisma.post.findUnique({ where: { slug } });
      if (!existing) throw new Error(`Post not found: ${slug}`);

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (excerpt !== undefined) updateData.excerpt = excerpt;
      if (status !== undefined) {
        updateData.status = status;
        if (status === "PUBLISHED" && !existing.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }

      if (tags !== undefined) {
        const tagRecords = await Promise.all(
          tags.map((name) =>
            prisma.tag.upsert({ where: { name }, update: {}, create: { name, slug: slugify(name) } })
          )
        );
        updateData.tags = { set: [], connect: tagRecords.map((t) => ({ id: t.id })) };
      }

      const updated = await prisma.post.update({ where: { slug }, data: updateData });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", metadata: { tool: "update_post", slug } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: updated.id, slug: updated.slug }) }] };
    }
  );

  server.tool(
    "delete_post",
    "Soft-delete a post by setting it to DRAFT status",
    {
      slug: z.string(),
    },
    async ({ slug }) => {
      await prisma.post.update({ where: { slug }, data: { status: "DRAFT", publishedAt: null } });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", metadata: { tool: "delete_post", slug } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true }) }] };
    }
  );

  server.tool(
    "create_project",
    "Create a new project entry",
    {
      title: z.string(),
      summary: z.string(),
      content: z.string(),
      techTags: z.array(z.string()),
      type: z.enum(["SOFTWARE", "ROBOTICS", "HARDWARE", "RESEARCH"]),
      githubUrl: z.string().optional(),
      liveUrl: z.string().optional(),
    },
    async ({ title, summary, content, techTags, type, githubUrl, liveUrl }) => {
      const slug = slugify(title);
      const project = await prisma.project.create({
        data: { title, slug, summary, content, techTags, type, githubUrl, liveUrl },
      });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", metadata: { tool: "create_project", slug } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: project.id, slug: project.slug }) }] };
    }
  );

  server.tool(
    "update_project",
    "Update an existing project by slug",
    {
      slug: z.string(),
      title: z.string().optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      techTags: z.array(z.string()).optional(),
      type: z.enum(["SOFTWARE", "ROBOTICS", "HARDWARE", "RESEARCH"]).optional(),
      githubUrl: z.string().optional(),
      liveUrl: z.string().optional(),
    },
    async ({ slug, title, summary, content, techTags, type, githubUrl, liveUrl }) => {
      const existing = await prisma.project.findUnique({ where: { slug } });
      if (!existing) throw new Error(`Project not found: ${slug}`);

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (summary !== undefined) updateData.summary = summary;
      if (content !== undefined) updateData.content = content;
      if (techTags !== undefined) updateData.techTags = techTags;
      if (type !== undefined) updateData.type = type;
      if (githubUrl !== undefined) updateData.githubUrl = githubUrl;
      if (liveUrl !== undefined) updateData.liveUrl = liveUrl;

      const updated = await prisma.project.update({ where: { slug }, data: updateData });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", metadata: { tool: "update_project", slug } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: updated.id, slug: updated.slug }) }] };
    }
  );

  server.tool(
    "add_skill",
    "Add a new skill to the portfolio",
    {
      name: z.string(),
      category: z.enum(["LANGUAGE", "FRAMEWORK", "TOOL", "ROBOTICS", "EMBEDDED", "DATABASE", "OTHER"]),
      level: z.enum(["FAMILIAR", "PROFICIENT", "EXPERT"]).optional(),
    },
    async ({ name, category, level }) => {
      const skill = await prisma.skill.create({ data: { name, category, level } });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", metadata: { tool: "add_skill", name } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: skill.id, name: skill.name }) }] };
    }
  );

  server.tool(
    "remove_skill",
    "Remove a skill by name",
    {
      name: z.string(),
    },
    async ({ name }) => {
      await prisma.skill.delete({ where: { name } });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", metadata: { tool: "remove_skill", name } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true }) }] };
    }
  );

  server.tool(
    "add_experience",
    "Add a new work experience entry",
    {
      company: z.string(),
      role: z.string(),
      description: z.string(),
      startDate: z.string().describe("ISO date string"),
      endDate: z.string().optional(),
      current: z.boolean().optional().default(false),
      location: z.string().optional(),
      type: z.enum(["FULLTIME", "PARTTIME", "CONTRACT", "INTERNSHIP", "VOLUNTEER"]).optional().default("FULLTIME"),
    },
    async ({ company, role, description, startDate, endDate, current, location, type }) => {
      const experience = await prisma.experience.create({
        data: {
          company,
          role,
          description,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          current,
          location,
          type,
        },
      });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", metadata: { tool: "add_experience", company, role } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ id: experience.id }) }] };
    }
  );

  server.tool(
    "update_owner_info",
    "Update the portfolio owner name",
    {
      name: z.string(),
    },
    async ({ name }) => {
      const user = await prisma.user.findFirst();
      if (!user) throw new Error("No admin user found");
      await prisma.user.update({ where: { id: user.id }, data: { name } });
      await prisma.auditLog.create({
        data: { action: "mcp.tool_call", entityId: user.id, metadata: { tool: "update_owner_info" } },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true }) }] };
    }
  );

  async function runAgentByType(agentType: string, toolName: string) {
    const agent = await prisma.agent.findFirst({ where: { type: agentType as AgentType } });
    if (!agent) throw new Error("Agent not found in DB — run the CLI seeder first");

    const runner = AGENT_RUNNERS[agent.type as AgentType];
    if (!runner) throw new Error("No runner registered for " + agentType);

    const claimed = await prisma.agent.updateMany({
      where: { id: agent.id, status: { not: "running" } },
      data: { status: "running", lastError: null },
    });
    if (claimed.count === 0) throw new Error("Agent is already running");

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
      const agentUpdateData: Record<string, unknown> = { status: "idle", lastRunAt: new Date() };
      if (result._updatedConfig) agentUpdateData.config = result._updatedConfig;
      await prisma.agent.update({ where: { id: agent.id }, data: agentUpdateData });
      await prisma.auditLog.create({
        data: {
          action: "mcp.tool_call",
          entityId: agent.id,
          metadata: { tool: toolName, agentType, reportTitle: result.title },
        },
      });
      return { ok: true, reportTitle: result.title };
    } catch (e) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { status: "error", lastError: e instanceof Error ? e.message : String(e) },
      });
      throw e;
    }
  }

  server.tool(
    "run_agent",
    "Trigger an AI agent run by type",
    {
      agentType: z.enum([
        "GITHUB_SUMMARIZER",
        "BRAND_MONITOR",
        "ROBOTICS_NEWS",
        "BLOG_SUGGESTER",
        "OPPORTUNITY_WATCHER",
        "SKILLS_INFERENCE",
        "GITHUB_PROJECT_IMPORTER",
        "CV_GENERATOR",
        "PLATFORM_SYNC",
      ]),
    },
    async ({ agentType }) => {
      const result = await runAgentByType(agentType, "run_agent");
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "generate_cv",
    "Trigger the CV Generator agent to produce an updated CV",
    {},
    async () => {
      const result = await runAgentByType("CV_GENERATOR", "generate_cv");
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "list_agents",
    "List all registered agents with their current status and last run time",
    {},
    async () => {
      const agents = await prisma.agent.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          type: true,
          enabled: true,
          status: true,
          schedule: true,
          lastRunAt: true,
          lastError: true,
          _count: { select: { reports: true } },
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(agents) }] };
    }
  );

  server.tool(
    "get_agent_reports",
    "Get reports for a specific agent. Returns up to 20 most recent reports including full raw data.",
    {
      agentType: z.enum([
        "GITHUB_SUMMARIZER",
        "BRAND_MONITOR",
        "ROBOTICS_NEWS",
        "BLOG_SUGGESTER",
        "OPPORTUNITY_WATCHER",
        "SKILLS_INFERENCE",
        "GITHUB_PROJECT_IMPORTER",
        "CV_GENERATOR",
        "PLATFORM_SYNC",
      ]).describe("The agent type to fetch reports for"),
      limit: z.number().int().min(1).max(50).optional().default(20),
    },
    async ({ agentType, limit }) => {
      const agent = await prisma.agent.findFirst({ where: { type: agentType as AgentType } });
      if (!agent) throw new Error("Agent not found: " + agentType);
      const reports = await prisma.agentReport.findMany({
        where: { agentId: agent.id },
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          summary: true,
          sources: true,
          rawData: true,
          readAt: true,
          createdAt: true,
        },
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ agent: { id: agent.id, name: agent.name, type: agent.type }, reports }),
          },
        ],
      };
    }
  );

  server.tool(
    "delete_agent_report",
    "Permanently delete an agent report by ID",
    {
      reportId: z.string().describe("The report ID to delete"),
    },
    async ({ reportId }) => {
      const report = await prisma.agentReport.findUnique({ where: { id: reportId } });
      if (!report) throw new Error("Report not found: " + reportId);
      await prisma.agentReport.delete({ where: { id: reportId } });
      await prisma.auditLog.create({
        data: {
          action: "mcp.tool_call",
          entityId: reportId,
          metadata: { tool: "delete_agent_report", reportId, title: report.title },
        },
      });
      return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, deleted: reportId }) }] };
    }
  );
}
