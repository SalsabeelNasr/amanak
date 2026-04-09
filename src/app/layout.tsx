import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic, Roboto } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-arabic",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${ibmPlexSansArabic.variable} ${roboto.variable}`}
    >
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
