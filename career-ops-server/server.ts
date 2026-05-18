import express, { Request, Response, NextFunction } from "express";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { dump } from "js-yaml";

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
const CV_OUTPUT_DIR = "/app/cv_output";
const PIPELINE_PATH = `${CV_OUTPUT_DIR}/pipeline.json`;

function appendToPipeline(jobId: string, url: string, job: Job): void {
  try {
    mkdirSync(CV_OUTPUT_DIR, { recursive: true });
    let entries: unknown[] = [];
    if (existsSync(PIPELINE_PATH)) {
      try { entries = JSON.parse(readFileSync(PIPELINE_PATH, "utf-8")); } catch { entries = []; }
    }
    const existing = entries.findIndex((e) => (e as { jobId?: string }).jobId === jobId);
    const record = { jobId, url, status: job.status, completedAt: new Date().toISOString(), pdfPath: job.pdfPath };
    if (existing >= 0) {
      entries[existing] = record;
    } else {
      entries.unshift(record);
    }
    writeFileSync(PIPELINE_PATH, JSON.stringify(entries, null, 2), "utf-8");
  } catch { /* non-critical */ }
}

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

function spawnJob(jobId: string, args: string[], cwd: string, pipelineUrl?: string): void {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "running";

  const child = spawn("claude", args, {
    cwd,
    env: { ...process.env },
  });

  const watchdog = setTimeout(() => {
    child.kill("SIGTERM");
    job.status = "error";
    job.log.push("\nJob timed out after 10 minutes.");
    if (pipelineUrl) appendToPipeline(jobId, pipelineUrl, job);
  }, 10 * 60 * 1000);

  child.stdout.on("data", (chunk: Buffer) => {
    job.log.push(chunk.toString());
  });

  child.stderr.on("data", (chunk: Buffer) => {
    job.log.push(chunk.toString());
  });

  child.on("close", (code: number | null) => {
    clearTimeout(watchdog);
    job.status = code === 0 ? "done" : "error";
    if (pipelineUrl) appendToPipeline(jobId, pipelineUrl, job);
  });
}

// POST /evaluate
app.post("/evaluate", (req: Request, res: Response): void => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    res.status(400).json({ error: "URL must be http or https" });
    return;
  }

  const jobId = randomUUID();
  jobs.set(jobId, { status: "pending", log: [] });
  res.json({ jobId });

  spawnJob(jobId, ["-p", `/career-ops ${url}`], "/app/career-ops", url);
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
  if (!existsSync(PIPELINE_PATH)) {
    res.json({ jobs: [] });
    return;
  }
  try {
    const raw = await readFile(PIPELINE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    // Normalise: file may be a bare array (from career-ops CLI) or already { jobs: [] }
    const jobs = Array.isArray(parsed) ? parsed : (parsed.jobs ?? []);
    res.json({ jobs });
  } catch {
    res.status(500).json({ error: "Failed to read pipeline.json" });
  }
});

// GET /health
app.get("/health", (_req: Request, res: Response): void => {
  res.json({ ok: true });
});

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
      dump(profile),
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
