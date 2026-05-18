export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdminSession();
  if (error) return error;

  const user = await prisma.user.findFirst({ select: { careerConfig: true } });
  return NextResponse.json(user?.careerConfig ?? {});
}

export async function PATCH(req: Request) {
  const { error } = await requireAdminSession();
  if (error) return error;

  const body = (await req.json()) as Record<string, unknown>;
  const user = await prisma.user.findFirst();
  if (!user) return NextResponse.json({ error: "No user" }, { status: 404 });

  const existing = (user.careerConfig as Record<string, unknown> | null) ?? {};

  function deepMerge(base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> {
    const result = { ...base };
    for (const [k, v] of Object.entries(patch)) {
      if (["__proto__", "constructor", "prototype"].includes(k)) continue;
      if (v !== null && typeof v === "object" && !Array.isArray(v) && typeof result[k] === "object" && result[k] !== null && !Array.isArray(result[k])) {
        result[k] = deepMerge(result[k] as Record<string, unknown>, v as Record<string, unknown>);
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  const merged = deepMerge(existing, body);

  await prisma.user.update({
    where: { id: user.id },
    data: { careerConfig: merged as Parameters<typeof prisma.user.update>[0]["data"]["careerConfig"] },
  });
  return NextResponse.json({ ok: true });
}
