import type { IncomingMessage } from "node:http";

export function checkBearer(req: IncomingMessage): boolean {
  const secret = process.env.MCP_SECRET;
  if (!secret) return true;
  return req.headers["authorization"] === `Bearer ${secret}`;
}
