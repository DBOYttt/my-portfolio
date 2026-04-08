import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const agents = await prisma.agent.findMany({
    include: {
      reports: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { reports: true } },
    },
  });

  const withUnread = await Promise.all(
    agents.map(async (agent) => {
      const unreadCount = await prisma.agentReport.count({
        where: { agentId: agent.id, readAt: null },
      });
      return { ...agent, unreadCount };
    })
  );

  return NextResponse.json(withUnread);
}
