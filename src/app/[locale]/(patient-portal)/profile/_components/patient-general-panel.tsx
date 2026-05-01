"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { patientTreatmentTitle } from "@/lib/patient-treatment-label";
import { User, Phone, Globe, Shield, Stethoscope, Mail, MapPin, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getPatientProfile,
  PATIENT_PROFILE_EVENT,
} from "@/lib/patient-profile-local";
import type { Lead, Patient } from "@/types";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PatientCareRequestsPanel } from "./patient-care-requests-panel";
import { usePatientCareRequestsFromStorage } from "../_hooks/use-patient-care-requests-store";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PATIENT_PROFILE_EVENT, onChange);
  return () => window.removeEventListener(PATIENT_PROFILE_EVENT, onChange);
}

function getSnapshot() {
  return getPatientProfile();
}

function getServerSnapshot() {
  return null;
}

export function PatientGeneralPanel({
  lead,
  patient,
}: {
  lead: Lead;
  patient: Patient | null;
}) {
  const t = useTranslations("portal");
  const tTreatments = useTranslations("treatments");
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const careRequests = usePatientCareRequestsFromStorage();

  const displayName = profile?.fullName?.trim() || patient?.name || "—";
  const displayPhone = profile?.phone?.trim() || patient?.phone || "—";
  const displayEmail = profile?.email?.trim() || patient?.email;
  const displayCountry = profile?.country?.trim() || patient?.country || "—";

  const initials = displayName
    .split(/\s+/)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-background shadow-sm sm:size-24 sm:text-2xl">
            {initials}
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-3xl">
              {displayName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {displayCountry}
              </div>
              <span className="hidden text-muted-foreground/30 sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Shield className="size-3.5" />
                {patient?.clientType ?? "—"}
              </div>
            </div>
          </div>
        </div>

        <Link
          href={ROUTES.patientOnboarding}
          className={cn(
            buttonVariants({ variant: "default", size: "lg" }),
            "h-12 rounded-2xl px-6 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]",
          )}
          prefetch={false}
        >
          <Plus className="me-2 size-5" />
          {t("requestTreatment")}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 sm:px-6 sm:py-4">
              <h3 className="text-xs font-semibold tracking-tight text-muted-foreground">
                {t("personalInfo")}
              </h3>
              <button className="text-xs font-bold text-primary active:opacity-70">
                {t("editProfile")}
              </button>
            </div>
            
            <div className="divide-y divide-border/40">
              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{t("email")}</span>
                </div>
                <span className="truncate text-sm font-semibold text-foreground sm:text-end">{displayEmail ?? "—"}</span>
              </div>
              
              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{t("phone")}</span>
                </div>
                <span className="text-sm font-semibold text-foreground sm:text-end">{displayPhone}</span>
              </div>

              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div className="flex items-center gap-3">
                  <Globe className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{t("country")}</span>
                </div>
                <span className="text-sm font-semibold text-foreground sm:text-end">{displayCountry}</span>
              </div>

              <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                <div className="flex items-center gap-3">
                  <Stethoscope className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{t("treatment")}</span>
                </div>
                <div className="flex sm:justify-end">
                  <Badge variant="secondary" className="max-w-full rounded-full font-bold">
                    <span className="truncate">
                      {patientTreatmentTitle(lead.treatmentSlug, (key) => tTreatments(key))}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <PatientCareRequestsPanel
            lead={lead}
            requests={careRequests}
          />
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-primary/5 p-5 sm:p-6 space-y-4">
            <h4 className="text-[10px] font-semibold tracking-tight text-primary/70">
              {t("accountStatus")}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("clientType")}</span>
                <span className="font-bold text-foreground">
                  {patient?.clientType ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("memberSince")}</span>
                <span className="font-bold text-foreground">Apr 2026</span>
              </div>
            </div>
            <div className="pt-2">
              <div className="rounded-xl bg-background/50 p-3 text-[10px] leading-relaxed text-muted-foreground border border-primary/10">
                {t("securityNote")}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
