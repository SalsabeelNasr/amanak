"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import {
  getPatientProfile,
  PATIENT_PROFILE_EVENT,
} from "@/lib/patient-profile-local";

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

export function PatientProfileWelcome({ leadFirstNameFallback }: { leadFirstNameFallback: string }) {
  const t = useTranslations("auth");
  const tPortal = useTranslations("portal");
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const fromProfile = profile?.fullName?.trim();
  const firstName = fromProfile
    ? (fromProfile.split(/\s+/)[0] ?? fromProfile)
    : leadFirstNameFallback;

  return (
    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
      {t("portalWelcome")}, {firstName || tPortal("profileNameFallback")}
    </h1>
  );
}
