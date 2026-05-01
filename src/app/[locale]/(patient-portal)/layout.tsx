"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { listDemoPatientOptions } from "@/lib/patient-demo";
import { listPatients } from "@/lib/api/patients";
import { ROUTES } from "@/lib/routes";
import { useSession } from "@/lib/mock-session";
import { wordmarkFont } from "@/lib/wordmark-font";
import { cn } from "@/lib/utils";
import type { MockUser, Patient } from "@/types";
import { PatientUserMenu } from "./_components/patient-user-menu";

function patientToMockUser(p: Patient): MockUser {
  return {
    id: p.id,
    name: p.name,
    role: "patient",
    email: p.email ?? `${p.id}@patient.demo`,
  };
}

const LOGOUT_TO_HOME_KEY = "amanak_logout_to_home";

export default function PatientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, login, logout } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [portalPatientUsers, setPortalPatientUsers] = useState<MockUser[]>(() =>
    listDemoPatientOptions().map((o) => o.user),
  );

  useEffect(() => {
    let cancelled = false;
    void listPatients({ hasPortalAccess: true }, {}).then((rows) => {
      if (cancelled || rows.length === 0) return;
      setPortalPatientUsers(rows.map(patientToMockUser));
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
    const target = portalPatientUsers.find((u) => u.id === nextPatientId);
    if (!target) return;
    router.push(`${ROUTES.patientProfile}?patient=${encodeURIComponent(target.id)}`);
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
              patientOptions={portalPatientUsers}
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
