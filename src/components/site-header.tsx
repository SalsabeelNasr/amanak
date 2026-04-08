"use client";

import { Menu } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
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
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const linkClass =
    "rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted md:py-2 md:text-sm";

  return (
    <nav
      className={cn(
        "flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-2",
        className,
      )}
    >
      <Link href="/" className={linkClass} onClick={onNavigate} prefetch={false}>
        {t("home")}
      </Link>
      <Link
        href={ROUTES.treatments}
        className={linkClass}
        onClick={onNavigate}
        prefetch={false}
      >
        {t("treatments")}
      </Link>
      <Link
        href={ROUTES.inquiry}
        className={linkClass}
        onClick={onNavigate}
        prefetch={false}
      >
        {t("inquiry")}
      </Link>
    </nav>
  );
}

export function SiteHeader() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const sheetSide = locale === "ar" ? "right" : "left";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className={cn(
            wordmarkFont.variable,
            "shrink-0 font-wordmark text-xl font-black leading-none tracking-tight text-brand-wordmark [font-synthesis-weight:auto] transition-colors hover:text-brand-wordmark/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-2xl",
          )}
          prefetch={false}
        >
          Amanak
        </Link>

        <div className="hidden min-w-0 flex-1 justify-center md:flex">
          <NavLinks />
        </div>

        <div className="ms-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <Link
            href={ROUTES.leadEntry}
            className={cn(buttonVariants({ size: "sm" }))}
            prefetch={false}
          >
            {t("estimate")}
          </Link>

          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                )}
                aria-expanded={mobileOpen}
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
                  <NavLinks onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
