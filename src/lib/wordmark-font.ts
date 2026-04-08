import { Saira_Stencil_One } from "next/font/google";

/** Logo/wordmark only (exempt from locale UI sans: Roboto/IBM order on `html`). Apply `variable` on the brand link only, not on `body`. */
export const wordmarkFont = Saira_Stencil_One({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-wordmark-family",
  display: "swap",
});
