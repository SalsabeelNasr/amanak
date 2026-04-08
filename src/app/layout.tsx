import type { ReactNode } from "react";

/** Root passthrough — real `<html>` / `<body>` live in `[locale]/layout.tsx` (next-intl pattern). */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
