export const runtime = "nodejs";

import { requireAdminSession } from "@/lib/admin-auth";
import { NextResponse } from "next/server";

interface PositionRow {
  company: string;
  role: string;
  description: string;
  location: string;
  startRaw: string;
  endRaw: string;
}

interface SkillRow {
  name: string;
}

function parseCSVLine(line: string): string[] {
  const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) ?? [];
  return cols.map((s) => s.replace(/^"|"$/g, "").trim());
}

export async function POST(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const lines = text.split("\n").filter(Boolean);

  if (type === "positions") {
    const rows: PositionRow[] = lines.slice(1).map((line) => {
      const cols = parseCSVLine(line);
      return {
        company: cols[0] ?? "",
        role: cols[1] ?? "",
        description: cols[2] ?? "",
        location: cols[3] ?? "",
        startRaw: cols[4] ?? "",
        endRaw: cols[5] ?? "",
      };
    }).filter((r) => r.company && r.role);

    return NextResponse.json({ type: "positions", preview: rows.slice(0, 20) });
  }

  if (type === "skills") {
    const rows: SkillRow[] = lines.slice(1).map((line) => {
      const cols = parseCSVLine(line);
      return { name: cols[0] ?? "" };
    }).filter((r) => r.name);

    return NextResponse.json({ type: "skills", preview: rows.slice(0, 30) });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
