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
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
    <nav className="flex flex-col gap-1">
      {items.map((it) => linkItem(it.href, it.label, it.Icon))}
      <div className="my-2 h-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="justify-start gap-3"
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
    if (!session.isAuthenticated || session.user.role !== "admin") {
      router.replace(ROUTES.backofficeLogin);
    }
  }, [session, router]);

  function handleLogout() {
    logout();
    router.replace(ROUTES.backofficeLogin);
  }

  if (!session.isAuthenticated || session.user.role !== "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur lg:hidden">
        <div className="flex min-h-14 items-center gap-3 px-4">
          <span className="text-sm font-semibold text-foreground">
            {tAuth("crmLabel")}
          </span>
          <div className="ms-auto flex items-center gap-2">
            <LocaleSwitcher />
            <Sheet>
              <SheetTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon-sm" }),
                )}
                aria-controls="crm-mobile-nav"
              >
                <Menu className="size-4" aria-hidden />
                <span className="sr-only">{tCrm("openMenu")}</span>
              </SheetTrigger>
              <SheetContent side={sheetSide} className="gap-0 p-0" id="crm-mobile-nav">
                <SheetHeader className="border-b border-border p-4 text-start">
                  <SheetTitle className="text-start">
                    {tAuth("crmLabel")}
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <NavItems closeSheet onLogout={handleLogout} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 border-e border-border/80 bg-card lg:flex lg:flex-col">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <span className="text-sm font-semibold text-foreground">
            {tAuth("crmLabel")}
          </span>
          <div className="ms-auto">
            <LocaleSwitcher />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavItems onLogout={handleLogout} />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
