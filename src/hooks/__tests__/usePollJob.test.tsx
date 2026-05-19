import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { usePollJob } from "../usePollJob";

describe("usePollJob", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calls onStatus with the polled status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "running", log: ["line 1"] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onStatus = vi.fn();
    const onLog = vi.fn();

    const { result } = renderHook(() =>
      usePollJob({ onStatus, onLog })
    );

    act(() => {
      result.current.start("job-123");
    });

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/career/status/job-123");
    expect(onStatus).toHaveBeenCalledWith("running");
    expect(onLog).toHaveBeenCalledWith(["line 1"]);
  });

  it("calls onTerminal and stops when status is done", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "done", log: [] }),
    }));

    const onStatus = vi.fn();
    const onTerminal = vi.fn();

    const { result } = renderHook(() =>
      usePollJob({ onStatus, onTerminal })
    );

    act(() => { result.current.start("job-abc"); });

    await act(async () => { vi.advanceTimersByTime(3000); });

    expect(onStatus).toHaveBeenCalledWith("done");
    expect(onTerminal).toHaveBeenCalledOnce();
  });

  it("calls onTimeout after POLL_MAX ticks", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "running" }),
    }));

    const onTimeout = vi.fn();

    const { result } = renderHook(() =>
      usePollJob({ onStatus: vi.fn(), onTimeout })
    );

    act(() => { result.current.start("job-timeout"); });

    await act(async () => {
      vi.advanceTimersByTime(3000 * 101); // 101 ticks > POLL_MAX(100)
    });

    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it("calls onError on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const onStatus = vi.fn();
    const onError = vi.fn();

    const { result } = renderHook(() =>
      usePollJob({ onStatus, onError })
    );

    act(() => { result.current.start("job-err"); });

    await act(async () => { vi.advanceTimersByTime(3000); });

    expect(onStatus).toHaveBeenCalledWith("error");
    expect(onError).toHaveBeenCalledOnce();
  });

  it("stop() clears the interval", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "running" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      usePollJob({ onStatus: vi.fn() })
    );

    act(() => { result.current.start("job-stop"); });
    act(() => { result.current.stop(); });

    await act(async () => { vi.advanceTimersByTime(9000); });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
