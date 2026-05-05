# MCP Server Setup

The portfolio MCP server exposes all portfolio content as readable resources and writable tools for use with Claude Desktop, Claude Code, and n8n.

## Modes

| Mode | Transport | Auth |
|------|-----------|------|
| stdio | stdin/stdout | Local process access only |
| HTTP | HTTP/SSE | `MCP_SECRET` bearer token |

## Prerequisites

`DATABASE_URL` must point to a running PostgreSQL instance. Run all agent seeders first if you want `run_agent` to work (`npx tsx agents/github-summarizer.ts`, etc. — each seeds its DB row on first run).

## Claude Code (stdio)

Create `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "portfolio": {
      "command": "npx",
      "args": ["tsx", "mcp-server/index.ts"]
    }
  }
}
```

Open Claude Code in the project directory. The `portfolio` server appears in the tool list automatically.

## Claude Desktop (stdio)

Add to `~/.config/claude/claude_desktop_config.json` (Linux) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "portfolio": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/my-portfolio/mcp-server/index.ts"],
      "env": {
        "DATABASE_URL": "postgres://portfolio:PASSWORD@127.0.0.1:5432/portfolio_db"
      }
    }
  }
}
```

Replace `/absolute/path/to/my-portfolio` with the actual path. Restart Claude Desktop.

## n8n (HTTP)

1. Set env vars in `.env`: `MCP_SECRET=your-secret-here`, `MCP_SERVER_PORT=3001`
2. Start the server: `npm run mcp:http`
3. In n8n, add an MCP node with:
   - URL: `http://localhost:3001`
   - Auth: Bearer token → value from `MCP_SECRET`

Example workflow: "GitHub push → run GITHUB_SUMMARIZER agent → read agent-reports resource → update project description"

## Available Resources

| URI | Description |
|-----|-------------|
| `portfolio://owner` | Owner name and email |
| `portfolio://posts` | All published blog posts (with tags) |
| `portfolio://posts/{slug}` | Single post by slug |
| `portfolio://projects` | All published projects |
| `portfolio://projects/{slug}` | Single project by slug |
| `portfolio://skills` | Skills grouped by category |
| `portfolio://experience` | Experience entries |
| `portfolio://agent-reports` | Latest report per agent |
| `portfolio://cv` | CV JSON content |

## Available Tools

| Tool | Description |
|------|-------------|
| `create_post` | Create a blog post (DRAFT by default) |
| `update_post` | Update post by slug |
| `delete_post` | Soft-delete post (sets status to DRAFT) |
| `create_project` | Create a project |
| `update_project` | Update project by slug |
| `add_skill` | Add a skill |
| `remove_skill` | Remove a skill by name |
| `add_experience` | Add an experience entry |
| `update_owner_info` | Update owner name |
| `run_agent` | Trigger an agent by type and save its report |
| `generate_cv` | Trigger CV Generator agent |

## Verification

Smoke-test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector npx tsx mcp-server/index.ts
```

Check that tool calls appear in the admin panel at `/admin/mcp`.
