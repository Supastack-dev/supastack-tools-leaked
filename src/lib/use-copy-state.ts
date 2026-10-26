"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { writeClipboard } from "./clipboard";

export type CopyState = "idle" | "copied" | "failed";

/**
 * The copy-button state machine every tool shares: idle → copied or failed,
 * both auto-resetting to idle after `resetMs`. `copy` resolves to the write
 * result so callers can branch on it; the state reflects it too.
 */
export function useCopyState(resetMs = 1600) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const resetSoon = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), resetMs);
  }, [resetMs]);

  const copy = useCallback(
    async (text: string) => {
      const ok = await writeClipboard(text);
      setState(ok ? "copied" : "failed");
      resetSoon();
      return ok;
    },
    [resetSoon],
  );

  return { state, copy } as const;
}
