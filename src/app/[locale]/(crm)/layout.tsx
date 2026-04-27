"use client";

import { useEffect, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BarChart3, FileText, LayoutDashboard, Users, LogOut, Menu } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/routes";
import { wordmarkFont } from "@/lib/wordmark-font";
import { useSession } from "@/lib/mock-session";
import { cn } from "@/lib/utils";

const LOGOUT_TO_HOME_KEY = "amanak_logout_to_home";

function CrmBrandMark({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Link
        href="/"
        data-amanak-wordmark
        prefetch={false}
        className={cn(
          wordmarkFont.variable,
          "min-w-0 shrink truncate font-wordmark text-lg font-black leading-none tracking-tight text-brand-wordmark [font-synthesis-weight:auto] transition-colors hover:text-brand-wordmark/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-xl",
          wordmarkClassName,
        )}
      >
        Amanak
      </Link>
      <Badge
        variant="outline"
        className="shrink-0 border-sidebar-border bg-sidebar-accent px-2 py-0 text-[10px] font-semibold tracking-wide text-sidebar-accent-foreground"
      >
        crm
      </Badge>
    </div>
  );
}

function NavItems({
  closeSheet = false,
  onLogout,
}: {
  closeSheet?: boolean;
  onLogout: () => void;
}) {
  const t = useTranslations("crm");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();

  const items = [
    { href: ROUTES.crmDashboard, label: t("dashboard"), Icon: LayoutDashboard },
    { href: ROUTES.crmLeads, label: t("leads"), Icon: Users },
    { href: ROUTES.crmQuotationCreation, label: t("quotationCreation"), Icon: FileText },
    { href: ROUTES.crmInsights, label: t("insights"), Icon: BarChart3 },
  ];

  function linkItem(href: string, label: string, Icon: typeof LayoutDashboard) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    const inner = (
      <Link
        href={href}
        prefetch={false}
        className={cn(
          "group flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border/50"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
        )}
      >
        <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-primary" : "opacity-70")} aria-hidden />
        <span className="flex-1 truncate">{label}</span>
        {active && (
          <div className="h-4 w-1 rounded-full bg-primary" aria-hidden />
        )}
      </Link>
    );
    if (closeSheet) {
      return <SheetClose key={href} nativeButton={false} render={inner} />;
    }
    return <div key={href}>{inner}</div>;
  }

  return (
    <nav className="flex flex-col gap-1.5" aria-label={t("crmNavAria")}>
      {items.map((it) => linkItem(it.href, it.label, it.Icon))}
      <div className="my-3 h-px bg-sidebar-border" />
      <div className="flex min-h-11 items-center px-3 py-2 [&_a]:text-sidebar-foreground/70 [&_a:hover]:text-sidebar-foreground">
        <LocaleSwitcher />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-h-11 justify-start gap-3 px-3 text-sidebar-foreground/70 hover:bg-destructive/5 hover:text-destructive"
        onClick={onLogout}
      >
        <LogOut className="size-4 opacity-70" aria-hidden />
        {tAuth("logout")}
      </Button>
    </nav>
  );
}

export default function CrmLayout({ children }: { children: ReactNode }) {
  const { session, logout } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const tAuth = useTranslations("auth");
  const tCrm = useTranslations("crm");
  const sheetSide = locale === "ar" ? "right" : "left";

  useEffect(() => {
    if (session.isAuthenticated && session.user.role === "admin") return;
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem(LOGOUT_TO_HOME_KEY) === "1") {
        sessionStorage.removeItem(LOGOUT_TO_HOME_KEY);
        return;
      }
    } catch {
      /* ignore */
    }
    router.replace(ROUTES.backofficeLogin);
  }, [session, router]);

  function handleLogout() {
    try {
      sessionStorage.setItem(LOGOUT_TO_HOME_KEY, "1");
    } catch {
      /* ignore */
    }
    logout();
    router.replace("/");
  }

  if (!session.isAuthenticated || session.user.role !== "admin") {
    return null;
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-app-canvas lg:flex-row"
      data-amanak-app-ui
    >
      {/* Mobile: menu on logical start (matches sheet edge); brand center */}
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md supports-backdrop-filter:bg-sidebar/90 lg:hidden">
        <div className="flex min-h-14 max-w-full items-center gap-2 px-4 pe-[max(1rem,env(safe-area-inset-right))] ps-[max(1rem,env(safe-area-inset-left))]">
          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "size-11 shrink-0 text-sidebar-foreground touch-manipulation",
              )}
              aria-controls="crm-mobile-nav"
            >
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">{tCrm("openMenu")}</span>
            </SheetTrigger>
            <SheetContent
              side={sheetSide}
              className="w-[min(100vw-1rem,20rem)] gap-0 border-sidebar-border bg-sidebar p-0 sm:max-w-sm"
              id="crm-mobile-nav"
            >
              <SheetHeader className="border-b border-sidebar-border p-4 text-start">
                <SheetTitle className="sr-only">{tAuth("crmLabel")}</SheetTitle>
                <CrmBrandMark />
              </SheetHeader>
              <div className="p-4 pe-[max(1rem,env(safe-area-inset-right))] ps-[max(1rem,env(safe-area-inset-left))]">
                <NavItems closeSheet onLogout={handleLogout} />
              </div>
            </SheetContent>
          </Sheet>

          <CrmBrandMark className="min-w-0 flex-1 justify-center" />
        </div>
      </header>

      {/* Desktop: sidebar on logical start; border on logical end */}
      <aside className="sticky top-0 hidden h-svh min-h-0 w-64 shrink-0 border-e border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <div className="flex items-center border-b border-sidebar-border px-3 py-4 sm:px-4">
          <CrmBrandMark className="w-full min-w-0" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
          <NavItems onLogout={handleLogout} />
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
        {children}
      </main>
    </div>
  );
}
