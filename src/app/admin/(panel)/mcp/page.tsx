import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "MCP Server | Admin",
};

export default async function McpAdminPage() {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const recentCalls = await prisma.auditLog.findMany({
    where: { action: { startsWith: "mcp." } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const mcpPort = process.env.MCP_SERVER_PORT ?? "3001";
  const httpEnabled = !!process.env.MCP_SECRET;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">MCP Server</h1>
        <p className="text-slate-500 text-sm font-mono mt-0.5">
          Model Context Protocol — tool access for AI clients
        </p>
      </div>

      {/* Status card */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Connection Modes
        </h2>
        <div className="space-y-3">
          {/* stdio */}
          <div className="flex items-start gap-3">
            <span className="text-xs px-2 py-0.5 rounded border text-cyan-400 bg-cyan-500/10 border-cyan-500/20 font-mono mt-0.5 shrink-0">
              stdio
            </span>
            <p className="text-slate-400 text-sm">
              Always available —{" "}
              <span className="font-mono text-slate-300 text-xs bg-[#0f1117] px-1.5 py-0.5 rounded">
                npx tsx mcp-server/index.ts
              </span>
            </p>
          </div>

          {/* HTTP */}
          <div className="flex items-start gap-3">
            <span className="text-xs px-2 py-0.5 rounded border font-mono mt-0.5 shrink-0 text-slate-400 bg-slate-500/10 border-slate-500/20">
              http
            </span>
            {httpEnabled ? (
              <p className="text-slate-400 text-sm">
                Enabled on port{" "}
                <span className="font-mono text-slate-300">{mcpPort}</span>{" "}
                <span className="text-xs px-1.5 py-0.5 rounded border text-green-400 bg-green-500/10 border-green-500/20">
                  active
                </span>
              </p>
            ) : (
              <p className="text-slate-400 text-sm">
                Disabled —{" "}
                <span className="font-mono text-slate-500 text-xs">
                  set MCP_SECRET to enable
                </span>{" "}
                <span className="text-xs px-1.5 py-0.5 rounded border text-slate-500 bg-slate-500/10 border-slate-500/20">
                  disabled
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent tool calls card */}
      <div className="bg-[#1a1d27] border border-[#2a2d3a] rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
          Recent Tool Calls{" "}
          <span className="text-slate-600 font-normal normal-case text-xs">(last 20)</span>
        </h2>

        {recentCalls.length === 0 ? (
          <p className="text-slate-500 text-sm">No MCP tool calls yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2d3a]">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2 pr-4">
                    Time
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2 pr-4">
                    Tool
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2 pr-4">
                    Entity ID
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2">
                    Metadata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2d3a]">
                {recentCalls.map((call) => {
                  const meta = call.metadata as Record<string, unknown> | null;
                  const tool = (meta?.tool as string | undefined) ?? call.action;
                  const metaWithoutTool = meta
                    ? Object.fromEntries(
                        Object.entries(meta).filter(([k]) => k !== "tool")
                      )
                    : null;
                  const metaStr =
                    metaWithoutTool && Object.keys(metaWithoutTool).length > 0
                      ? JSON.stringify(metaWithoutTool)
                      : null;

                  return (
                    <tr key={call.id}>
                      <td className="py-2 pr-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {call.createdAt.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-cyan-400 font-mono text-xs whitespace-nowrap">
                        {tool}
                      </td>
                      <td className="py-2 pr-4 text-slate-400 font-mono text-xs">
                        {call.entityId ?? "—"}
                      </td>
                      <td className="py-2 text-slate-500 font-mono text-xs max-w-xs truncate">
                        {metaStr ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
