import express, { Request, Response, NextFunction } from "express";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

const app = express();
app.use(express.json());

const PORT = 4200;
const SECRET = process.env.CAREER_OPS_INTERNAL_SECRET;

type JobStatus = "pending" | "running" | "done" | "error";

interface Job {
  status: JobStatus;
  log: string[];
  pdfPath?: string;
}

const jobs = new Map<string, Job>();

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!SECRET) {
    next();
    return;
  }
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.use(authMiddleware);

function spawnJob(jobId: string, args: string[], cwd: string): void {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "running";

  const child = spawn("claude", args, {
    cwd,
    env: { ...process.env },
  });

  child.stdout.on("data", (chunk: Buffer) => {
    job.log.push(chunk.toString());
  });

  child.stderr.on("data", (chunk: Buffer) => {
    job.log.push(chunk.toString());
  });

  child.on("close", (code: number | null) => {
    job.status = code === 0 ? "done" : "error";
  });
}

// POST /evaluate
app.post("/evaluate", (req: Request, res: Response): void => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const jobId = randomUUID();
  jobs.set(jobId, { status: "pending", log: [] });
  res.json({ jobId });

  spawnJob(jobId, ["-p", `/career-ops ${url}`], "/app/career-ops");
});

// GET /status/:jobId
app.get("/status/:jobId", (req: Request, res: Response): void => {
  const job = jobs.get(req.params["jobId"] as string);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json({ status: job.status, log: job.log, pdfPath: job.pdfPath });
});

// POST /cv/master
app.post("/cv/master", (req: Request, res: Response): void => {
  const jobId = randomUUID();
  jobs.set(jobId, { status: "pending", log: [] });
  res.json({ jobId });

  spawnJob(jobId, ["-p", "/cv master"], "/app/career-ops");
});

// GET /pipeline
app.get("/pipeline", async (_req: Request, res: Response): Promise<void> => {
  const pipelinePath = "/app/cv_output/pipeline.json";
  if (!existsSync(pipelinePath)) {
    res.json({ jobs: [] });
    return;
  }
  try {
    const raw = await readFile(pipelinePath, "utf-8");
    res.json(JSON.parse(raw));
  } catch {
    res.status(500).json({ error: "Failed to read pipeline.json" });
  }
});

// GET /health
app.get("/health", (_req: Request, res: Response): void => {
  res.json({ ok: true });
});

// ─── YAML serialiser (no extra deps) ─────────────────────────────────────────

function toYaml(obj: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (obj === null || obj === undefined) return "~";
  if (typeof obj === "string") {
    if (/[:#\[\]{},|>&*!'"\\]/.test(obj) || obj.includes("\n")) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const entries = Object.entries(item as Record<string, unknown>);
          const first = entries[0];
          const rest = entries.slice(1);
          const firstLine = `${pad}- ${first[0]}: ${toYaml(first[1], indent + 1)}`;
          const restLines = rest.map(([k, v]) => `${pad}  ${k}: ${toYaml(v, indent + 1)}`);
          return [firstLine, ...restLines].join("\n");
        }
        return `${pad}- ${toYaml(item, indent)}`;
      })
      .join("\n");
  }
  if (typeof obj === "object") {
    return Object.entries(obj as Record<string, unknown>)
      .map(([k, v]) => {
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          return `${pad}${k}:\n${Object.entries(v as Record<string, unknown>)
            .map(([sk, sv]) => `${"  ".repeat(indent + 1)}${sk}: ${toYaml(sv, indent + 2)}`)
            .join("\n")}`;
        }
        if (Array.isArray(v) && v.length > 0) {
          return `${pad}${k}:\n${toYaml(v, indent + 1)}`;
        }
        return `${pad}${k}: ${toYaml(v, indent + 1)}`;
      })
      .join("\n");
  }
  return String(obj);
}

// POST /sync
interface SyncBody {
  profile?: unknown;
  cv?: string;
}

app.post("/sync", (req: Request, res: Response): void => {
  const { profile, cv } = req.body as SyncBody;

  if (!profile || typeof cv !== "string") {
    res.status(400).json({ error: "profile and cv are required" });
    return;
  }

  const profileDir = "/app/career-ops/config";
  const profilePath = path.join(profileDir, "profile.yml");
  const cvPath = "/app/career-ops/cv.md";

  try {
    mkdirSync(profileDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const profileContent = [
      `# Auto-generated by portfolio sync — edit via admin Career panel`,
      `# Last synced: ${timestamp}`,
      ``,
      toYaml(profile),
    ].join("\n");

    writeFileSync(profilePath, profileContent, "utf-8");
    writeFileSync(cvPath, cv, "utf-8");

    res.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to write files: ${message}` });
  }
});

app.listen(PORT, () => {
  console.log(`career-ops-server listening on port ${PORT}`);
});
