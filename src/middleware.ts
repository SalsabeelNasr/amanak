import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: false,
  alternateLinks: false,
  localeCookie: {
    name: "NEXT_LOCALE",
  },
});

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/ar", request.url));
  }

  const legacyBook = /^\/(ar|en)\/book-consultation\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (legacyBook) {
    const locale = legacyBook[1];
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/contact`;
    url.hash = "book-consultation";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
