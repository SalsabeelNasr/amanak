"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { crm } from "@/lib/crm/client";
import { ROUTES } from "@/lib/routes";
import { patientTreatmentTitle } from "@/lib/patient-treatment-label";
import { PatientNewRequestDialog } from "./patient-new-request-dialog";
import { formatDate } from "@/components/crm/date-format";
import { StatusBadge } from "@/components/crm/status-badge";
import { useLangKey } from "@/components/crm/use-lang-key";
import type { Patient, Request } from "@/types";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  Hash,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(3),
  email: z.string().trim().optional(),
  country: z.string().trim().min(1),
  age: z.string().optional(),
  clientType: z.enum(["b2c", "b2b", "g2b"]),
  hasPortalAccess: z.boolean(),
  notes: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

function patientInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts.at(-1)![0]!).toUpperCase();
}

function translatedClientType(
  clientType: Patient["clientType"],
  t: (key: string) => string,
): string {
  switch (clientType) {
    case "b2c":
      return t("clientTypes.b2c");
    case "b2b":
      return t("clientTypes.b2b");
    case "g2b":
      return t("clientTypes.g2b");
    default:
      return clientType;
  }
}

export function PatientDetailTabs({
  patient: initialPatient,
  initialRequests,
}: {
  patient: Patient;
  initialRequests: Request[];
}) {
  const t = useTranslations("crm.patientDetail");
  const tCrm = useTranslations("crm");
  const tTreatments = useTranslations("treatments");
  const locale = useLocale();
  const langKey = useLangKey();
  const router = useRouter();
  const [patient, setPatient] = useState(initialPatient);
  const [requests, setRequests] = useState(initialRequests);
  const [tab, setTab] = useState<"profile" | "requests">("profile");
  const [newOpen, setNewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedTick, setShowSavedTick] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState(false);
  const savingLock = useRef(false);
  const dirtyRef = useRef(false);
  const tickHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: patient.name,
      phone: patient.phone,
      email: patient.email ?? "",
      country: patient.country,
      age: patient.age != null ? String(patient.age) : "",
      clientType: patient.clientType,
      hasPortalAccess: patient.hasPortalAccess,
      notes: patient.notes ?? "",
    },
  });

  const flashSavedTick = useCallback(() => {
    setShowSavedTick(true);
    if (tickHideTimer.current) clearTimeout(tickHideTimer.current);
    tickHideTimer.current = setTimeout(() => {
      setShowSavedTick(false);
      tickHideTimer.current = null;
    }, 2800);
  }, []);

  useEffect(
    () => () => {
      if (tickHideTimer.current) clearTimeout(tickHideTimer.current);
    },
    [],
  );

  const persistProfile = useCallback(
    async (
      values: ProfileForm,
      options: { toastOnSuccess: boolean; toastOnError: boolean },
    ) => {
      if (savingLock.current) return;
      savingLock.current = true;
      setIsSaving(true);
      try {
        const ageNum =
          values.age?.trim() && !Number.isNaN(Number(values.age))
            ? Number.parseInt(values.age, 10)
            : undefined;
        const updated = await crm.patients.update(
          patient.id,
          {
            name: values.name,
            phone: values.phone,
            country: values.country,
            age: ageNum,
            clientType: values.clientType,
            hasPortalAccess: values.hasPortalAccess,
            notes: values.notes?.trim() || undefined,
            email: values.email && values.email.length > 0 ? values.email : undefined,
          },
          {},
        );
        setPatient(updated);
        form.reset({
          name: updated.name,
          phone: updated.phone,
          email: updated.email ?? "",
          country: updated.country,
          age: updated.age != null ? String(updated.age) : "",
          clientType: updated.clientType,
          hasPortalAccess: updated.hasPortalAccess,
          notes: updated.notes ?? "",
        });
        dirtyRef.current = false;
        setAutoSaveError(false);
        flashSavedTick();
        if (options.toastOnSuccess) {
          toast.success(t("toastProfileSaved"));
        }
      } catch (e) {
        console.error(e);
        if (options.toastOnError) {
          toast.error(t("toastProfileSaveError"));
        } else {
          setAutoSaveError(true);
        }
      } finally {
        savingLock.current = false;
        setIsSaving(false);
      }
    },
    [patient.id, form, flashSavedTick, t],
  );

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    const subscription = form.watch(() => {
      dirtyRef.current = form.formState.isDirty;
      setAutoSaveError(false);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void (async () => {
          if (!dirtyRef.current) return;
          const valid = await form.trigger();
          if (!valid) return;
          await persistProfile(form.getValues(), {
            toastOnSuccess: false,
            toastOnError: false,
          });
        })();
      }, 900);
    });
    return () => {
      subscription.unsubscribe();
      clearTimeout(debounceTimer);
    };
  }, [form, persistProfile]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [requests],
  );

  const memberSince = formatDate(patient.createdAt, locale);

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-4 pb-16 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-background shadow-sm sm:size-24 sm:text-2xl">
            {patientInitials(patient.name)}
          </div>
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {patient.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {patient.country}
              </span>
              <span className="hidden text-muted-foreground/30 sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <Shield className="size-3.5 shrink-0" aria-hidden />
                {translatedClientType(patient.clientType, tCrm)}
              </span>
              {patient.phone ? (
                <>
                  <span className="hidden text-muted-foreground/30 sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5 shrink-0" aria-hidden />
                    {patient.phone}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as typeof tab)}
        className="gap-6"
      >
        <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-px">
          <TabsList variant="underline" aria-label={t("profileTabsAria")}>
            <TabsTrigger value="profile" className="min-w-[5.5rem] sm:min-w-0">
              {t("tabProfile")}
            </TabsTrigger>
            <TabsTrigger value="requests" className="min-w-[5.5rem] sm:min-w-0">
              {t("tabRequests")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="animate-in fade-in duration-200">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <form
                onSubmit={form.handleSubmit((values) =>
                  void persistProfile(values, { toastOnSuccess: true, toastOnError: true }),
                )}
              >
                <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-border/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-semibold tracking-tight text-muted-foreground">
                        {t("personalInfo")}
                      </h2>
                      {isSaving ? (
                        <Loader2
                          className="size-4 shrink-0 animate-spin text-muted-foreground"
                          aria-hidden
                        />
                      ) : showSavedTick ? (
                        <CheckCircle2
                          className="size-5 shrink-0 text-emerald-600"
                          aria-label={t("saved")}
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <User className="size-4 shrink-0" aria-hidden />
                        <span className="text-sm font-medium">{t("fieldName")}</span>
                      </div>
                      <Input className="sm:max-w-xs sm:text-end" {...form.register("name")} />
                    </div>
                    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Phone className="size-4 shrink-0" aria-hidden />
                        <span className="text-sm font-medium">{t("fieldPhone")}</span>
                      </div>
                      <Input className="sm:max-w-xs sm:text-end" {...form.register("phone")} />
                    </div>
                    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Mail className="size-4 shrink-0" aria-hidden />
                        <span className="text-sm font-medium">{t("fieldEmail")}</span>
                      </div>
                      <Input
                        type="email"
                        className="sm:max-w-xs sm:text-end"
                        {...form.register("email")}
                      />
                    </div>
                    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Globe className="size-4 shrink-0" aria-hidden />
                        <span className="text-sm font-medium">{t("fieldCountry")}</span>
                      </div>
                      <Input className="sm:max-w-xs sm:text-end" {...form.register("country")} />
                    </div>
                    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Hash className="size-4 shrink-0" aria-hidden />
                        <span className="text-sm font-medium">{t("fieldAge")}</span>
                      </div>
                      <Input
                        type="number"
                        min={1}
                        className="sm:max-w-xs sm:text-end"
                        {...form.register("age")}
                      />
                    </div>
                    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Shield className="size-4 shrink-0" aria-hidden />
                        <span className="text-sm font-medium">{t("fieldClientType")}</span>
                      </div>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-xs sm:self-end"
                        {...form.register("clientType")}
                      >
                        <option value="b2c">B2C</option>
                        <option value="b2b">B2B</option>
                        <option value="g2b">G2B</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t("fieldPortalAccess")}
                      </span>
                      <label className="flex items-center gap-2 sm:max-w-xs sm:flex-row-reverse">
                        <input type="checkbox" {...form.register("hasPortalAccess")} />
                      </label>
                    </div>
                    <div className="px-4 py-3 sm:px-6 sm:py-4">
                      <Label className="text-sm font-medium text-muted-foreground">
                        {t("fieldNotes")}
                      </Label>
                      <textarea
                        className="mt-2 flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                        {...form.register("notes")}
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="submit"
                    disabled={!form.formState.isDirty || isSaving}
                    className="w-full sm:w-auto"
                  >
                    {isSaving ? t("saving") : t("saveProfile")}
                  </Button>
                  {autoSaveError ? (
                    <p className="text-sm text-destructive">{t("profileAutoSaveFailed")}</p>
                  ) : null}
                </div>
              </form>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-border/50 bg-primary/5 p-5 sm:p-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-tight text-primary/70">
                  {t("accountStatus")}
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{t("fieldPortalAccess")}</span>
                    <Badge
                      variant={patient.hasPortalAccess ? "default" : "secondary"}
                      className={cn(
                        "font-semibold",
                        patient.hasPortalAccess &&
                          "border-emerald-200 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
                      )}
                    >
                      {patient.hasPortalAccess ? t("badgePortal") : t("badgeNoPortal")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{t("memberSince")}</span>
                    <span className="font-bold text-foreground">{memberSince}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{t("recordUpdated")}</span>
                    <span className="font-bold text-foreground">
                      {formatDate(patient.updatedAt, locale)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-primary/10 bg-background/50 p-3 text-[10px] leading-relaxed text-muted-foreground">
                  {t("securityNote")}
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="animate-in fade-in duration-200">
          <div className="mb-4 flex justify-end">
            <Button type="button" onClick={() => setNewOpen(true)}>
              {t("newRequest")}
            </Button>
          </div>
          {sortedRequests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
              {t("requestsEmpty")}
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-4">
              {sortedRequests.map((r) => (
                <Link
                  key={r.id}
                  href={`${ROUTES.crmRequests}/${r.id}`}
                  prefetch={false}
                  className="group block min-w-0"
                >
                  <div
                    className={cn(
                      "flex min-h-[5.75rem] flex-col justify-center overflow-hidden amanak-app-surface-card shadow-none",
                      "p-4 transition-shadow duration-200 hover:shadow-sm hover:shadow-primary/5 active:scale-[0.99] lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:p-3",
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="truncate text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                        {patientTreatmentTitle(r.treatmentSlug, (k) => tTreatments(k))}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {r.followUpDueAt
                          ? `${t("reqFollowUp")}: ${formatDate(r.followUpDueAt, locale)}`
                          : t("reqNoFollowUp")}
                      </p>
                    </div>
                    <div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3 lg:mt-0 lg:border-0 lg:pt-0">
                      <StatusBadge status={r.status} langKey={langKey} variant="table" />
                      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground tabular-nums">
                        <Clock className="size-3 shrink-0 opacity-70" aria-hidden />
                        {formatDate(r.updatedAt, locale)}
                        <ChevronRight
                          className="size-3.5 shrink-0 text-muted-foreground/35 transition-all group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PatientNewRequestDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        patient={patient}
        onCreated={(created) => {
          setRequests((prev) => [created, ...prev]);
          setNewOpen(false);
          router.push(`${ROUTES.crmRequests}/${created.id}`);
        }}
      />
    </div>
  );
}
