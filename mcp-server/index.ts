import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPortfolioServer } from "./server";
import { startHttpServer } from "./http";

const isHttp = process.argv.includes("--http");
const port = parseInt(process.env.MCP_SERVER_PORT ?? "3001", 10);

if (isHttp) {
  startHttpServer(port);
} else {
  void (async () => {
    const server = createPortfolioServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  })();
}
