import { NextResponse } from "next/server";

interface CareerOpsRequestOptions {
  method?: string;
  body?: unknown;
  timeout?: number;
}

export type CareerOpsResult =
  | { ok: true; response: Response }
  | { ok: false; errorResponse: NextResponse };

export async function careerOpsRequest(
  endpoint: string,
  options: CareerOpsRequestOptions = {}
): Promise<CareerOpsResult> {
  const { method = "GET", body, timeout = 10_000 } = options;

  const internalUrl = process.env.CAREER_OPS_INTERNAL_URL;
  const secret = process.env.CAREER_OPS_INTERNAL_SECRET;

  if (!internalUrl) {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "Career-ops service not configured" },
        { status: 503 }
      ),
    };
  }

  const headers: Record<string, string> = {};
  if (secret) headers["Authorization"] = `Bearer ${secret}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(`${internalUrl}${endpoint}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout),
    });
    return { ok: true, response };
  } catch {
    return {
      ok: false,
      errorResponse: NextResponse.json(
        { error: "career-ops service unavailable" },
        { status: 503 }
      ),
    };
  }
}
