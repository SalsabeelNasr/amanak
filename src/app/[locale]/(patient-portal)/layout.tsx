"use client";

import { useEffect, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { listDemoPatientOptions } from "@/lib/patient-demo";
import { ROUTES } from "@/lib/routes";
import { useSession } from "@/lib/mock-session";
import { wordmarkFont } from "@/lib/wordmark-font";
import { cn } from "@/lib/utils";
import { PatientUserMenu } from "./_components/patient-user-menu";

const LOGOUT_TO_HOME_KEY = "amanak_logout_to_home";

export default function PatientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, login, logout } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoPatients = listDemoPatientOptions();
  const activePatientId =
    searchParams.get("patient") ??
    (session.isAuthenticated && session.user.role === "patient" ? session.user.id : "patient_1");

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

  function handleSwitchPatient(nextPatientId: string) {
    const target = demoPatients.find((entry) => entry.patientId === nextPatientId);
    if (!target) return;
    router.push(`${ROUTES.patientProfile}?patient=${encodeURIComponent(target.patientId)}`);
  }

  if (!session.isAuthenticated || session.user.role !== "patient") {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background" data-amanak-app-ui>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/90 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="mx-auto flex min-h-14 w-full max-w-screen-2xl items-center gap-3 px-4 [direction:ltr] sm:px-6 lg:px-10">
          <Link
            href={`${ROUTES.patientProfile}?patient=${encodeURIComponent(activePatientId)}`}
            data-amanak-wordmark
            className={cn(
              wordmarkFont.variable,
              "shrink-0 font-wordmark text-xl font-black tracking-tight text-brand-wordmark",
            )}
            prefetch={false}
          >
            Amanak
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <PatientUserMenu
              user={session.user}
              activePatientId={activePatientId}
              patientOptions={demoPatients.map((entry) => entry.user)}
              onSwitchPatient={(nextUser) => {
                login(nextUser);
                handleSwitchPatient(nextUser.id);
              }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
