"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";

type DialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

/**
 * Wraps shadcn Dialog and restores focus to the last focused element when the dialog closes.
 */
export function DialogShell({ open, onOpenChange, children }: DialogShellProps) {
  const previousFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      previousFocus.current = document.activeElement as HTMLElement | null;
    }
    if (!open && wasOpen.current) {
      const el = previousFocus.current;
      requestAnimationFrame(() => {
        if (el && typeof el.focus === "function") {
          el.focus();
        }
      });
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}
