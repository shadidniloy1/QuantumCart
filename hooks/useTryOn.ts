"use client";

import { useState, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TryOnStatus =
  | "idle"
  | "uploading"
  | "processing"
  | "succeeded"
  | "failed";

interface TryOnResult {
  status: TryOnStatus;
  resultUrl: string | null;
  error: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Simplified — no polling needed since the HF route streams and waits inline.
// The single POST to /api/try-on blocks until the result is ready (up to 10 min).

export function useTryOn() {
  const [state, setState] = useState<TryOnResult>({
    status: "idle",
    resultUrl: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const startTryOn = useCallback(async (params: {
    userPhotoUrl: string;
    garmentImageUrl: string;
    garmentDescription?: string;
  }) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({ status: "uploading", resultUrl: null, error: null });

    try {
      setState((s) => ({ ...s, status: "processing" }));

      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: abortRef.current.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setState({
          status: "failed",
          resultUrl: null,
          error: data.debug ?? data.error ?? "Try-on failed",
        });
        return;
      }

      setState({
        status: "succeeded",
        resultUrl: data.resultUrl,
        error: null,
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Network error";
      setState({ status: "failed", resultUrl: null, error: msg });
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ status: "idle", resultUrl: null, error: null });
  }, []);

  return { ...state, startTryOn, reset };
}

// ─── Status label helper ──────────────────────────────────────────────────────

export function getTryOnStatusLabel(status: TryOnStatus): string {
  switch (status) {
    case "idle":        return "Ready";
    case "uploading":   return "Sending images...";
    case "processing":  return "AI is generating your look (this can take 3–10 min on free tier)...";
    case "succeeded":   return "Done!";
    case "failed":      return "Failed";
  }
}