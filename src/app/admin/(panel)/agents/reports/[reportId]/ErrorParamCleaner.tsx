"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function ErrorParamCleaner({ hasError }: { hasError: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (hasError) router.replace(pathname);
  }, [hasError, router, pathname]);
  return null;
}
