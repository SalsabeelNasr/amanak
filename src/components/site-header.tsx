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
  SheetHeader,
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
      {linkItem(ROUTES.aboutUs, t("aboutUs"))}
      {linkItem(ROUTES.treatments, t("treatments"))}
    </nav>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const sheetSide = locale === "ar" ? "right" : "left";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur supports-backdrop-filter:bg-card/80">
      {/* Grid mirrors in RTL: logo column moves to inline-end, actions to inline-start (mirror of LTR). */}
      <div className="mx-auto grid min-h-14 w-full max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          data-amanak-wordmark
          className={cn(
            wordmarkFont.variable,
            /* font-wordmark + data attr: logo always Saira Stencil; exempt from locale --font-sans (Roboto/IBM order). */
            "shrink-0 justify-self-start font-wordmark text-xl font-black leading-none tracking-tight text-brand-wordmark [font-synthesis-weight:auto] transition-colors hover:text-brand-wordmark/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-2xl",
          )}
          prefetch={false}
        >
          Amanak
        </Link>

        <div className="hidden min-w-0 justify-self-center md:flex">
          <NavLinks />
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <LocaleSwitcher />
          <Link
            href={ROUTES.login}
            className={cn(buttonVariants({ size: "sm" }))}
            prefetch={false}
          >
            {t("login")}
          </Link>

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
                <SheetHeader className="border-b border-border p-4 text-start">
                  <SheetTitle className="text-start">{t("openMenu")}</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <NavLinks closeSheet />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
