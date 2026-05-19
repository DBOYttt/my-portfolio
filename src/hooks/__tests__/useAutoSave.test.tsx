import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAutoSave } from "../useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("does not save before markServerState is called (first-load guard)", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({ x: 1 }, saveFn)
    );

    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(saveFn).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it("does not save when value matches server state", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: { x: 1 } } }
    );

    act(() => { result.current.markServerState({ x: 1 }); });
    rerender({ value: { x: 1 } });

    await act(async () => { vi.advanceTimersByTime(1000); });

    expect(saveFn).not.toHaveBeenCalled();
  });

  it("debounces and saves when value changes after markServerState", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: { x: 1 } } }
    );

    act(() => { result.current.markServerState({ x: 1 }); });
    rerender({ value: { x: 2 } });

    await act(async () => { vi.advanceTimersByTime(800); });

    expect(saveFn).toHaveBeenCalledWith({ x: 2 });
    expect(result.current.saved).toBe(true);
  });

  it("sets error=true when saveFn throws", async () => {
    const saveFn = vi.fn().mockRejectedValue(new Error("fail"));
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: { x: 1 } } }
    );

    act(() => { result.current.markServerState({ x: 1 }); });
    rerender({ value: { x: 2 } });

    await act(async () => { vi.advanceTimersByTime(800); });

    expect(result.current.error).toBe(true);
    expect(result.current.saved).toBe(false);
  });

  it("resets saved to false after 2 seconds", async () => {
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave(value, saveFn),
      { initialProps: { value: { x: 1 } } }
    );

    act(() => { result.current.markServerState({ x: 1 }); });
    rerender({ value: { x: 2 } });

    await act(async () => { vi.advanceTimersByTime(800); });
    expect(result.current.saved).toBe(true);

    await act(async () => { vi.advanceTimersByTime(2000); });
    expect(result.current.saved).toBe(false);
  });
});
