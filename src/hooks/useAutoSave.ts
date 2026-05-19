"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoSaveOptions {
  delay?: number;
}

export interface UseAutoSaveReturn {
  saving: boolean;
  saved: boolean;
  error: boolean;
  markServerState: (value: unknown) => void;
}

export function useAutoSave<T>(
  value: T,
  saveFn: (value: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const { delay = 800 } = options;

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const isFirstLoad = useRef(true);
  const serverStateRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const markServerState = useCallback((v: unknown) => {
    serverStateRef.current = JSON.stringify(v);
    isFirstLoad.current = false;
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) return;
    const serialized = JSON.stringify(value);
    if (serialized === serverStateRef.current) return;

    if (debounceRef.current !== null) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      setError(false);
      setSaved(false);
      try {
        await saveFnRef.current(value);
        serverStateRef.current = JSON.stringify(value);
        setSaving(false);
        setSaved(true);
        if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
      } catch {
        setSaving(false);
        setError(true);
      }
    }, delay);
  }, [value, delay]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) clearTimeout(debounceRef.current);
      if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
    };
  }, []);

  return { saving, saved, error, markServerState };
}
