"use client";

import { Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { wordmarkFont } from "@/lib/wordmark-font";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/locale-switcher";

function NavLinks({
  className,
  closeSheet = false,
}: {
  className?: string;
  /** When true, each link closes the mobile sheet via `SheetClose` (uncontrolled drawer). */
  closeSheet?: boolean;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const linkClass =
    "rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted md:py-2 md:text-sm";

  function navItemActive(href: string): boolean {
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkItem(href: string, label: string) {
    const active = navItemActive(href);
    /** Desktop topbar only (`closeSheet` is only used for the mobile sheet). */
    const desktopActive = active && !closeSheet;
    const inner = (
      <Link
        href={href}
        className={cn(
          linkClass,
          desktopActive &&
            "text-primary [text-shadow:0_1px_2px_rgba(140,140,140,0.45)]",
        )}
        aria-current={active ? "page" : undefined}
        prefetch={false}
      >
        {label}
      </Link>
    );
    if (closeSheet) {
      return <SheetClose nativeButton={false} render={inner} />;
    }
    return inner;
  }

  return (
    <nav
      className={cn(
        "flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-2",
        className,
      )}
    >
      {linkItem("/", t("home"))}
      {linkItem(ROUTES.treatments, t("treatments"))}
      {linkItem(ROUTES.partners, t("partners"))}
      {linkItem(ROUTES.aboutUs, t("aboutUs"))}
      {linkItem(ROUTES.contactUs, t("contactUs"))}
    </nav>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const sheetSide = locale === "ar" ? "right" : "left";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur supports-backdrop-filter:bg-card/80">
      {/* Mobile: flex + justify-between mirrors in RTL (logo inline-start, actions inline-end). md+: 3-col grid. */}
      <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-0 px-4 [direction:ltr] sm:px-6 md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-3 md:justify-normal">
        <Link
          href="/"
          data-amanak-wordmark
          className={cn(
            wordmarkFont.variable,
            /* font-wordmark + data attr: logo always Saira Stencil; exempt from locale --font-sans (Roboto/IBM order). */
            "shrink-0 font-wordmark text-xl font-black leading-none tracking-tight text-brand-wordmark [font-synthesis-weight:auto] transition-colors hover:text-brand-wordmark/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-2xl md:justify-self-start",
          )}
          prefetch={false}
        >
          Amanak
        </Link>

        <div className="hidden min-w-0 md:flex md:justify-self-center">
          <NavLinks />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 md:justify-end">
          <div className="hidden items-center gap-2 sm:gap-3 md:flex">
            <LocaleSwitcher />
            <Link
              href={ROUTES.login}
              className={cn(buttonVariants({ size: "sm" }))}
              prefetch={false}
            >
              {t("login")}
            </Link>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                )}
                aria-controls="mobile-navigation"
                data-testid="nav-menu-trigger"
              >
                <Menu className="size-4" aria-hidden />
                <span className="sr-only">{t("openMenu")}</span>
              </SheetTrigger>
              <SheetContent side={sheetSide} className="gap-0 p-0" id="mobile-navigation">
                <SheetTitle className="sr-only">{t("openMenu")}</SheetTitle>
                <div className="flex flex-col p-4">
                  <NavLinks closeSheet />
                  <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                    <SheetClose
                      nativeButton={false}
                      render={
                        <LocaleSwitcher className="rounded-md px-3 py-3 text-base hover:bg-muted hover:text-foreground" />
                      }
                    />
                    <SheetClose
                      nativeButton={false}
                      render={
                        <Link
                          href={ROUTES.login}
                          className={cn(
                            buttonVariants({ size: "sm" }),
                            "w-full justify-center",
                          )}
                          prefetch={false}
                        >
                          {t("login")}
                        </Link>
                      }
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
