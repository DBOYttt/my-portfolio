"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Ctx = { isDirty: boolean; setDirty: (v: boolean) => void };
const UnsavedChangesCtx = createContext<Ctx>({ isDirty: false, setDirty: () => {} });

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setDirtyState] = useState(false);
  const setDirty = useCallback((v: boolean) => setDirtyState(v), []);
  return <UnsavedChangesCtx.Provider value={{ isDirty, setDirty }}>{children}</UnsavedChangesCtx.Provider>;
}

export const useUnsavedChanges = () => useContext(UnsavedChangesCtx);
