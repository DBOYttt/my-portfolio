import express, { Request, Response, NextFunction } from "express";
import { spawn } from "child_process";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
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

app.listen(PORT, () => {
  console.log(`career-ops-server listening on port ${PORT}`);
});
