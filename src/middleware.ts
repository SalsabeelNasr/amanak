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

  const legacyHair = /^\/(ar|en)\/treatments\/(fue-extraction|fut-transplantation|dhi-implantation|robotic-hair-transplant)\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (legacyHair) {
    const locale = legacyHair[1];
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/treatments/hair-transplant`;
    return NextResponse.redirect(url, 308);
  }

  const removedIvfVariants = /^\/(ar|en)\/treatments\/(conventional-ivf|icsi)\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (removedIvfVariants) {
    const locale = removedIvfVariants[1];
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/treatments/ivf`;
    return NextResponse.redirect(url, 308);
  }


  const removedLipReduction = /^\/(ar|en)\/treatments\/lip-reduction\/?$/.exec(
    request.nextUrl.pathname,
  );
  if (removedLipReduction) {
    const locale = removedLipReduction[1];
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/treatments`;
    return NextResponse.redirect(url, 308);
  }

  const crmLeads = /^\/(ar|en)\/crm\/leads(\/.*)?$/.exec(request.nextUrl.pathname);
  if (crmLeads) {
    const locale = crmLeads[1];
    const suffix = crmLeads[2] ?? "";
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/crm/requests${suffix}`;
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
