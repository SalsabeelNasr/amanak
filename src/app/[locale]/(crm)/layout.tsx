"use client";

import { useEffect, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LayoutDashboard, Users, LogOut, Menu } from "lucide-react";
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
import { ROUTES } from "@/lib/routes";
import { useSession } from "@/lib/mock-session";
import { cn } from "@/lib/utils";

const LOGOUT_TO_HOME_KEY = "amanak_logout_to_home";

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
  ];

  function linkItem(href: string, label: string, Icon: typeof LayoutDashboard) {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    const inner = (
      <Link
        href={href}
        prefetch={false}
        className={cn(
          "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="size-4" aria-hidden />
        <span>{label}</span>
      </Link>
    );
    if (closeSheet) {
      return <SheetClose key={href} nativeButton={false} render={inner} />;
    }
    return <div key={href}>{inner}</div>;
  }

  return (
    <nav className="flex flex-col gap-1" aria-label={t("crmNavAria")}>
      {items.map((it) => linkItem(it.href, it.label, it.Icon))}
      <div className="my-2 h-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="min-h-11 justify-start gap-3 px-3"
        onClick={onLogout}
      >
        <LogOut className="size-4" aria-hidden />
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
      className="flex min-h-screen flex-col bg-background lg:flex-row"
      data-amanak-app-ui
    >
      {/* Mobile: menu on logical start (matches sheet edge); title center; locale on end */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md supports-backdrop-filter:bg-card/90 lg:hidden">
        <div className="flex min-h-14 max-w-full items-center gap-2 px-4 pe-[max(1rem,env(safe-area-inset-right))] ps-[max(1rem,env(safe-area-inset-left))]">
          <Sheet>
            <SheetTrigger
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" }),
                "size-11 shrink-0 touch-manipulation",
              )}
              aria-controls="crm-mobile-nav"
            >
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">{tCrm("openMenu")}</span>
            </SheetTrigger>
            <SheetContent
              side={sheetSide}
              className="w-[min(100vw-1rem,20rem)] gap-0 border-border/80 p-0 sm:max-w-sm"
              id="crm-mobile-nav"
            >
              <SheetHeader className="border-b border-border p-4 text-start">
                <SheetTitle className="text-start text-base">
                  {tAuth("crmLabel")}
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 pe-[max(1rem,env(safe-area-inset-right))] ps-[max(1rem,env(safe-area-inset-left))]">
                <NavItems closeSheet onLogout={handleLogout} />
              </div>
            </SheetContent>
          </Sheet>

          <span className="min-w-0 flex-1 truncate text-start text-sm font-semibold text-foreground">
            {tAuth("crmLabel")}
          </span>

          <div className="-me-1 flex min-h-11 shrink-0 items-center justify-center rounded-lg px-2 py-1">
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      {/* Desktop: sidebar on logical start; border on logical end */}
      <aside className="sticky top-0 hidden h-svh min-h-0 w-56 shrink-0 border-e border-border/80 bg-card lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-border px-3 py-4 sm:px-4">
          <span className="min-w-0 flex-1 truncate text-start text-sm font-semibold text-foreground">
            {tAuth("crmLabel")}
          </span>
          <div className="flex shrink-0 items-center rounded-lg px-1 py-0.5">
            <LocaleSwitcher />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
          <NavItems onLogout={handleLogout} />
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
        {children}
      </main>
    </div>
  );
}
