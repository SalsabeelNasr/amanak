"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ROUTES } from "@/lib/routes";
import { useSession } from "@/lib/mock-session";
import { wordmarkFont } from "@/lib/wordmark-font";
import { cn } from "@/lib/utils";

const LOGOUT_TO_HOME_KEY = "amanak_logout_to_home";

export default function PatientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, logout } = useSession();
  const router = useRouter();
  const t = useTranslations("auth");

  useEffect(() => {
    if (session.isAuthenticated && session.user.role === "patient") return;
    try {
      if (typeof window !== "undefined" && sessionStorage.getItem(LOGOUT_TO_HOME_KEY) === "1") {
        sessionStorage.removeItem(LOGOUT_TO_HOME_KEY);
        return;
      }
    } catch {
      /* ignore */
    }
    router.replace(ROUTES.login);
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

  if (!session.isAuthenticated || session.user.role !== "patient") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" data-amanak-app-ui>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            href={ROUTES.patientProfile}
            data-amanak-wordmark
            className={cn(
              wordmarkFont.variable,
              "shrink-0 font-wordmark text-xl font-black tracking-tight text-brand-wordmark",
            )}
            prefetch={false}
          >
            Amanak
          </Link>
          <div className="ms-auto flex items-center gap-3">
            <LocaleSwitcher />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLogout}
            >
              {t("logout")}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
