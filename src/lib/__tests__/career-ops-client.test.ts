import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("careerOpsRequest", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.restoreAllMocks();
  });

  it("returns errorResponse when CAREER_OPS_INTERNAL_URL is unset", async () => {
    delete process.env.CAREER_OPS_INTERNAL_URL;
    const { careerOpsRequest } = await import("../career-ops-client");
    const result = await careerOpsRequest("/health");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.errorResponse.json() as { error: string };
      expect(body.error).toBe("Career-ops service not configured");
      expect(result.errorResponse.status).toBe(503);
    }
  });

  it("returns errorResponse when fetch throws", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const { careerOpsRequest } = await import("../career-ops-client");
    const result = await careerOpsRequest("/health");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = await result.errorResponse.json() as { error: string };
      expect(body.error).toBe("career-ops service unavailable");
    }
  });

  it("returns ok:true with the Response on success", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    const fakeResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse));
    const { careerOpsRequest } = await import("../career-ops-client");
    const result = await careerOpsRequest("/health");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.status).toBe(200);
    }
  });

  it("sets Authorization header when secret is present", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    process.env.CAREER_OPS_INTERNAL_SECRET = "mysecret";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { careerOpsRequest } = await import("../career-ops-client");
    await careerOpsRequest("/health");
    expect(fetchMock.mock.calls[0][1].headers["Authorization"]).toBe("Bearer mysecret");
  });

  it("serialises body as JSON and sets Content-Type", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { careerOpsRequest } = await import("../career-ops-client");
    await careerOpsRequest("/evaluate", { method: "POST", body: { url: "https://example.com" } });
    expect(fetchMock.mock.calls[0][1].body).toBe(JSON.stringify({ url: "https://example.com" }));
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
  });

  it("passes an AbortSignal to fetch", async () => {
    process.env.CAREER_OPS_INTERNAL_URL = "http://career-ops:4200";
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { careerOpsRequest } = await import("../career-ops-client");
    await careerOpsRequest("/health");
    const fetchOptions = fetchMock.mock.calls[0][1] as RequestInit;
    expect(fetchOptions.signal).toBeInstanceOf(AbortSignal);
  });
});
