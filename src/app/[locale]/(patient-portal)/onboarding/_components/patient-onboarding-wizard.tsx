"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/lib/routes";
import type { Treatment } from "@/types";

const ONBOARDING_DONE_KEY = "amanak_onboarding_demo_done";

type Step = "treatment" | "fork" | "estimate" | "contact";

export function PatientOnboardingWizard({ treatments }: { treatments: Treatment[] }) {
  const t = useTranslations("portal");
  const router = useRouter();
  const [step, setStep] = useState<Step>("treatment");
  const [treatmentSlug, setTreatmentSlug] = useState<string>("");
  const [path, setPath] = useState<"estimate" | "talk" | null>(null);
  const [phone, setPhone] = useState("");
  const [contactTime, setContactTime] = useState("");
  const [partySize, setPartySize] = useState<"1" | "2">("1");

  function finish() {
    try {
      localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    } catch {
      /* ignore */
    }
    router.push(ROUTES.patientProfile);
  }

  return (
    <Card className="mx-auto w-full max-w-lg border-border/60 shadow-sm">
      <CardContent className="space-y-6 py-8">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("onboardingTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("onboardingSubtitle")}</p>
        </header>

        {step === "treatment" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ob-treatment">{t("onboardingStepTreatment")}</Label>
              <select
                id="ob-treatment"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={treatmentSlug}
                onChange={(e) => setTreatmentSlug(e.target.value)}
              >
                <option value="">{`—`}</option>
                {treatments.map((tr) => (
                  <option key={tr.slug} value={tr.slug}>
                    {tr.slug}
                  </option>
                ))}
              </select>
            </div>
            <Button
              className="w-full"
              disabled={!treatmentSlug}
              onClick={() => setStep("fork")}
            >
              {t("onboardingContinue")}
            </Button>
          </div>
        ) : null}

        {step === "fork" ? (
          <div className="space-y-4">
            <p className="text-sm font-medium">{t("onboardingStepPath")}</p>
            <div className="flex flex-col gap-2">
              <Button
                variant={path === "estimate" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setPath("estimate");
                  setStep("estimate");
                }}
              >
                {t("onboardingGetEstimate")}
              </Button>
              <Button
                variant={path === "talk" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  setPath("talk");
                  setStep("contact");
                }}
              >
                {t("onboardingTalkSomeone")}
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setStep("treatment")}>
              ←
            </Button>
          </div>
        ) : null}

        {step === "estimate" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("treatment")}</Label>
              <p className="text-sm text-muted-foreground">{treatmentSlug}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ob-party">Travelers</Label>
              <select
                id="ob-party"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={partySize}
                onChange={(e) => setPartySize(e.target.value as "1" | "2")}
              >
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={() => {
                setStep("contact");
                setPath("talk");
              }}
            >
              {t("onboardingEscapeHatch")}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep("fork")}>
                ←
              </Button>
              <Button className="flex-1" onClick={finish}>
                {t("onboardingDone")}
              </Button>
            </div>
          </div>
        ) : null}

        {step === "contact" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ob-phone">{t("onboardingPhone")}</Label>
              <Input
                id="ob-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ob-time">{t("onboardingContactTime")}</Label>
              <Input
                id="ob-time"
                value={contactTime}
                onChange={(e) => setContactTime(e.target.value)}
                placeholder="e.g. Afternoons GMT+3"
              />
            </div>
            <Button className="w-full" onClick={finish}>
              {t("onboardingSubmitContact")}
            </Button>
          </div>
        ) : null}

        <p className="text-center text-[11px] text-muted-foreground">{t("onboardingMockNote")}</p>
      </CardContent>
    </Card>
  );
}
