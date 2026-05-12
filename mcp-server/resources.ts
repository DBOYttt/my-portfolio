import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { prisma } from "../src/lib/prisma";

export function registerResources(server: McpServer): void {
  server.resource(
    "owner",
    "portfolio://owner",
    { description: "Portfolio owner profile information", mimeType: "application/json" },
    async (_uri) => {
      const data = await prisma.user.findFirst({
        select: { name: true, email: true, cvContent: true, cvGeneratedAt: true, cvSource: true },
      });
      return { contents: [{ uri: "portfolio://owner", mimeType: "application/json", text: JSON.stringify(data) }] };
    }
  );

  server.resource(
    "skills",
    "portfolio://skills",
    { description: "All portfolio skills grouped by category", mimeType: "application/json" },
    async (_uri) => {
      const data = await prisma.skill.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });
      return { contents: [{ uri: "portfolio://skills", mimeType: "application/json", text: JSON.stringify(data) }] };
    }
  );

  server.resource(
    "experience",
    "portfolio://experience",
    { description: "Work experience entries ordered by position", mimeType: "application/json" },
    async (_uri) => {
      const data = await prisma.experience.findMany({ orderBy: { order: "asc" } });
      return { contents: [{ uri: "portfolio://experience", mimeType: "application/json", text: JSON.stringify(data) }] };
    }
  );

  server.resource(
    "agent-reports",
    "portfolio://agent-reports",
    { description: "All agents with their most recent report", mimeType: "application/json" },
    async (_uri) => {
      const data = await prisma.agent.findMany({
        include: { reports: { orderBy: { createdAt: "desc" }, take: 1 } },
      });
      return { contents: [{ uri: "portfolio://agent-reports", mimeType: "application/json", text: JSON.stringify(data) }] };
    }
  );

  server.resource(
    "cv",
    "portfolio://cv",
    { description: "Current CV content and metadata", mimeType: "application/json" },
    async (_uri) => {
      const data = await prisma.user.findFirst({ select: { name: true, careerConfig: true } });
      return { contents: [{ uri: "portfolio://cv", mimeType: "application/json", text: JSON.stringify(data) }] };
    }
  );

  const postsTemplate = new ResourceTemplate("portfolio://posts/{slug}", {
    list: async () => {
      const posts = await prisma.post.findMany({
        where: { status: "PUBLISHED" },
        include: { tags: true },
        orderBy: { publishedAt: "desc" },
      });
      return { resources: posts.map((p) => ({ name: p.title, uri: "portfolio://posts/" + p.slug })) };
    },
  });

  server.resource(
    "post",
    postsTemplate,
    { description: "A published blog post by slug", mimeType: "application/json" },
    async (uri, vars) => {
      const slug = vars.slug as string;
      const post = await prisma.post.findUnique({ where: { slug }, include: { tags: true } });
      if (!post) throw new Error(`Post not found: ${slug}`);
      return { contents: [{ uri: uri.toString(), mimeType: "application/json", text: JSON.stringify(post) }] };
    }
  );

  const projectsTemplate = new ResourceTemplate("portfolio://projects/{slug}", {
    list: async () => {
      const projects = await prisma.project.findMany({ where: { publishedAt: { not: null } } });
      return { resources: projects.map((p) => ({ name: p.title, uri: "portfolio://projects/" + p.slug })) };
    },
  });

  server.resource(
    "project",
    projectsTemplate,
    { description: "A published project by slug", mimeType: "application/json" },
    async (uri, vars) => {
      const slug = vars.slug as string;
      const project = await prisma.project.findUnique({ where: { slug } });
      if (!project) throw new Error(`Project not found: ${slug}`);
      return { contents: [{ uri: uri.toString(), mimeType: "application/json", text: JSON.stringify(project) }] };
    }
  );
}
