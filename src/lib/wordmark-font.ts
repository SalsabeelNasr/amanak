import { Saira_Stencil_One } from "next/font/google";

/** Logo/wordmark only — apply `wordmarkFont.variable` on the brand link, not on `body`. */
export const wordmarkFont = Saira_Stencil_One({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-wordmark-family",
  display: "swap",
});
