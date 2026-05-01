"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared layout for a file row in the patient portal Files tab (checklist + payment proofs).
 * Keeps border, spacing, and icon treatment consistent across document types.
 */
export function DocumentFileRow({
  leading,
  primary,
  secondary,
  badges,
  action,
  pendingHighlight,
}: {
  /** Icon or linked icon, centered in the 12×12 tile (matches checklist behavior). */
  leading: ReactNode;
  primary: ReactNode;
  secondary: ReactNode;
  badges?: ReactNode;
  action: ReactNode;
  /** Amber border when a mandatory checklist item is still pending. */
  pendingHighlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border bg-card p-4",
        pendingHighlight ? "border-amber-500/35" : "border-border/50",
      )}
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/5">
        {leading}
      </div>
      <div className="min-w-0 flex-1">
        <div className="min-w-0 text-sm font-bold text-foreground">{primary}</div>
        <div className="amanak-app-field-label mt-0.5">{secondary}</div>
        {badges ? <div className="mt-2 flex flex-wrap items-center gap-2">{badges}</div> : null}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
