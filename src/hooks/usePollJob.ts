"use client";

import { useCallback, useEffect, useRef } from "react";
import type { JobStatus, StatusResponse } from "@/types/career";

export type { JobStatus };

export interface PollJobCallbacks {
  onStatus: (status: JobStatus) => void;
  onLog?: (lines: string[]) => void;
  onTerminal?: () => void;
  onTimeout?: () => void;
  onError?: () => void;
}

const POLL_MAX = 100;
const POLL_INTERVAL_MS = 3000;
const KNOWN_STATUSES: JobStatus[] = ["pending", "running", "done", "error"];

export function usePollJob(callbacks: PollJobCallbacks) {
  const cbRef = useRef(callbacks);
  cbRef.current = callbacks;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (jobId: string) => {
      stop();
      countRef.current = 0;
      fetchingRef.current = false;

      intervalRef.current = setInterval(async () => {
        countRef.current += 1;

        if (countRef.current >= POLL_MAX) {
          stop();
          if (mountedRef.current) cbRef.current.onTimeout?.();
          return;
        }

        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
          const res = await fetch(`/api/admin/career/status/${jobId}`);
          if (!mountedRef.current) return;
          if (!res.ok) {
            stop();
            cbRef.current.onStatus("error");
            cbRef.current.onError?.();
            return;
          }
          const data = (await res.json()) as StatusResponse;
          if (!mountedRef.current) return;

          if (data.log) cbRef.current.onLog?.(data.log);

          const status =
            data.status && KNOWN_STATUSES.includes(data.status as JobStatus)
              ? (data.status as JobStatus)
              : null;

          if (status) {
            cbRef.current.onStatus(status);
            if (status === "done" || status === "error") {
              stop();
              cbRef.current.onTerminal?.();
            }
          } else if (data.status) {
            stop();
            cbRef.current.onStatus("error");
            cbRef.current.onError?.();
          }
        } catch {
          if (!mountedRef.current) return;
          stop();
          cbRef.current.onStatus("error");
          cbRef.current.onError?.();
        } finally {
          fetchingRef.current = false;
        }
      }, POLL_INTERVAL_MS);
    },
    [stop]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [stop]);

  return { start, stop };
}
