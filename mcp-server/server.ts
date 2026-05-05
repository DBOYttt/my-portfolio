import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerResources } from "./resources";
import { registerTools } from "./tools";

export function createPortfolioServer(): McpServer {
  const server = new McpServer({ name: "portfolio-mcp", version: "1.0.0" });
  registerResources(server);
  registerTools(server);
  return server;
}
