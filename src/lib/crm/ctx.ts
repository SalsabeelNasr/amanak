import type { MockUser } from "@/types";

/**
 * Per-call context for every CrmClient method. The shape is the seam to a
 * future HTTP backend: `actor` is the authenticated user (used today only by
 * mutation side-effects, e.g. completing a system task that drives a pipeline
 * transition); `signal` is reserved for AbortController plumbing once a real
 * fetch implementation lands.
 */
export type CrmCtx = {
  actor?: MockUser;
  signal?: AbortSignal;
  /** When true, mock implementations sleep ~450 ms to simulate latency. */
  simulateDelay?: boolean;
  /** Optional per-call note (used today by transition-driving task completions). */
  note?: string;
};

/** Default empty context for server-component reads where no actor is needed. */
export const EMPTY_CRM_CTX: CrmCtx = {};

/**
 * Resolve the server-side context. Today returns an empty context — once auth
 * lands this will read the session cookie / header and populate `actor`.
 */
export function getServerCrmCtx(): CrmCtx {
  return EMPTY_CRM_CTX;
}
