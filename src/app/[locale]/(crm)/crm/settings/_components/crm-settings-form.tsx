"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { crm } from "@/lib/crm/client";
import { EMPTY_CRM_CTX } from "@/lib/crm/ctx";
import type { LeadTaskTemplateKey } from "@/types";
import {
  applyCrmSettingsPatch,
  AREA_ORDER,
  computeDefaultStayNightsFromTrips,
  getDefaultCrmSettings,
  type CrmSettings,
  type DeepPartial,
} from "@/lib/api/crm-settings";
import type { EstimateAreaZone } from "@/lib/api/patient-estimate-catalog";
import { listLeadTaskTemplateKeys } from "@/lib/services/lead-task-rules";
import {
  ArrowUpDown,
  Bell,
  Check,
  CircleDollarSign,
  DollarSign,
  GripVertical,
  ListTodo,
  MessageSquare,
  Percent,
  RotateCcw,
  Save,
  ShieldCheck,
  TrendingUp,
  Clock,
  Users,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLangKey } from "@/components/crm/use-lang-key";

type Props = { initial: CrmSettings };

const TASK_TEMPLATE_KEYS = listLeadTaskTemplateKeys();

const TASK_TEMPLATE_LABEL_KEYS = {
  lead_qualification: "taskTemplateLabels.lead_qualification",
  await_patient_estimate: "taskTemplateLabels.await_patient_estimate",
  collect_documents: "taskTemplateLabels.collect_documents",
  initial_consultation: "taskTemplateLabels.initial_consultation",
  consultant_review: "taskTemplateLabels.consultant_review",
  prepare_quotation: "taskTemplateLabels.prepare_quotation",
  await_patient_quote_response: "taskTemplateLabels.await_patient_quote_response",
  send_contract: "taskTemplateLabels.send_contract",
  confirm_payment: "taskTemplateLabels.confirm_payment",
  create_order: "taskTemplateLabels.create_order",
  assign_specialist: "taskTemplateLabels.assign_specialist",
  treatment_followup: "taskTemplateLabels.treatment_followup",
} as const satisfies Record<LeadTaskTemplateKey, string>;

export function CrmSettingsForm({ initial }: Props) {
  const t = useTranslations("crm");
  const langKey = useLangKey();
  const [model, setModel] = useState<CrmSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  function patch(p: DeepPartial<CrmSettings>) {
    setModel((m) => applyCrmSettingsPatch(m, p));
  }

  function reset() {
    setModel(getDefaultCrmSettings());
  }

  async function save() {
    setSaving(true);
    setShowSuccess(false);
    try {
      const next = await crm.settings.update(model, EMPTY_CRM_CTX);
      setModel(next);
      setShowSuccess(true);
    } finally {
      setSaving(false);
    }
  }

  function toggleOpenTaskTemplateKey(key: LeadTaskTemplateKey, checked: boolean) {
    setModel((m) => ({
      ...m,
      sortingRules: m.sortingRules.map((r) => {
        if (r.id !== "open_matching_tasks") return r;
        const cur = new Set(r.taskTemplateKeys ?? []);
        if (checked) cur.add(key);
        else cur.delete(key);
        return { ...r, taskTemplateKeys: Array.from(cur) };
      }),
    }));
  }

  function setOpenTaskMatch(mode: "any" | "all") {
    setModel((m) => ({
      ...m,
      sortingRules: m.sortingRules.map((r) =>
        r.id === "open_matching_tasks" ? { ...r, taskOpenMatch: mode } : r,
      ),
    }));
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newRules = [...model.sortingRules];
    const item = newRules.splice(draggedIndex, 1)[0];
    newRules.splice(index, 0, item);

    setModel((prev) => ({ ...prev, sortingRules: newRules }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs defaultValue="leads" className="w-full">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList variant="underline" className="w-full flex-wrap sm:w-auto">
              <TabsTrigger value="leads" className="gap-2">
                <Users className="size-4" />
                {t("settingsTabLeads")}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2">
                <ListTodo className="size-4" />
                {t("settingsTabTasks")}
              </TabsTrigger>
              <TabsTrigger value="costs" className="gap-2">
                <DollarSign className="size-4" />
                {t("settingsTabCosts")}
              </TabsTrigger>
              <TabsTrigger value="quotation-rules" className="gap-2">
                <Percent className="size-4" />
                {t("settingsTabQuotationRules")}
              </TabsTrigger>
              <TabsTrigger value="reminders" className="gap-2">
                <Bell className="size-4" />
                {t("settingsTabReminders")}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              {showSuccess && (
                <div className="flex items-center gap-1.5 text-sm font-medium text-success animate-in fade-in slide-in-from-right-2">
                  <Check className="size-4" />
                  {t("settingsSaved")}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={reset} disabled={saving}>
                <RotateCcw className="size-3.5" />
                {t("settingsReset")}
              </Button>
              <Button type="button" size="sm" onClick={save} disabled={saving} className="min-w-[100px]">
                {saving ? (
                  <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <>
                    <Save className="size-3.5" />
                    {t("settingsSave")}
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-6">
            <TabsContent value="leads" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-muted-foreground">{t("settingsLeadsTabIntro")}</p>

              <aside
                className="flex gap-3 rounded-xl border border-border/60 bg-muted/25 p-4 text-sm leading-relaxed text-muted-foreground"
                role="note"
              >
                <Info
                  className="size-5 shrink-0 text-primary mt-0.5"
                  aria-hidden
                />
                <p>{t("settingsLeadsFollowUpDueHint")}</p>
              </aside>

              <aside
                className="flex gap-3 rounded-xl border border-border/60 bg-muted/25 p-4 text-sm leading-relaxed text-muted-foreground"
                role="note"
              >
                <Clock
                  className="size-5 shrink-0 text-primary mt-0.5"
                  aria-hidden
                />
                <div className="min-w-0 space-y-3">
                  <p>
                    {t("settingsLeadsQualificationDueHint", {
                      hours:
                        model.taskRules.leadQualificationSlaHours ?? 24,
                    })}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Label
                      htmlFor="crm-lead-qual-sla"
                      className="text-xs font-medium text-foreground shrink-0"
                    >
                      {t("settingsLeadQualificationSlaLabel")}
                    </Label>
                    <Input
                      id="crm-lead-qual-sla"
                      type="number"
                      min={1}
                      max={168}
                      className="h-9 w-20 rounded-lg text-sm tabular-nums"
                      value={model.taskRules.leadQualificationSlaHours ?? 24}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        patch({
                          taskRules: {
                            leadQualificationSlaHours: Number.isFinite(v)
                              ? Math.max(1, Math.min(168, Math.round(v)))
                              : 24,
                          },
                        });
                      }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("settingsLeadQualificationSlaSuffix")}
                    </span>
                  </div>
                </div>
              </aside>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="size-5 text-primary" />
                    {t("settingsNextActionStateMachineTitle")}
                  </CardTitle>
                  <CardDescription>{t("settingsNextActionStateMachineDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t("settingsNextActionStateMachineRule")}
                  </p>
                  <div className="overflow-hidden rounded-xl border border-border/60">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-2 text-start font-medium">
                            {t("settingsNextActionStageCol")}
                          </th>
                          <th className="px-4 py-2 text-start font-medium">
                            {t("settingsNextActionTaskCol")}
                          </th>
                          <th className="px-4 py-2 text-start font-medium">
                            {t("settingsNextActionEventCol")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="px-4 py-2">{t("settingsNextActionStageEstimate")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionTaskEstimate")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionEventEstimate")}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">{t("settingsNextActionStageQuotation")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionTaskQuotation")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionEventQuotation")}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">{t("settingsNextActionStageBooking")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionTaskBooking")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionEventBooking")}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">{t("settingsNextActionStageArrived")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionTaskArrived")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionEventArrived")}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">{t("settingsNextActionStageInTreatment")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionTaskInTreatment")}</td>
                          <td className="px-4 py-2">{t("settingsNextActionEventInTreatment")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("settingsNextActionStateMachineBackendNote")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowUpDown className="size-5 text-primary" />
                    {t("settingsSectionSortingRules")}
                  </CardTitle>
                  <CardDescription>{t("settingsSortingRulesDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {model.sortingRules.map((rule, idx) => (
                      <div
                        key={rule.id}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "rounded-lg bg-card p-3 ring-1 ring-foreground/10 transition-all",
                          draggedIndex === idx ? "opacity-60 ring-primary/50" : "hover:ring-primary/25",
                        )}
                      >
                        <div className="flex gap-3">
                          <button
                            type="button"
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            className="mt-0.5 h-fit shrink-0 cursor-grab rounded p-0.5 text-muted-foreground hover:text-foreground active:cursor-grabbing"
                            aria-label={t("settingsSortingDragHandle")}
                          >
                            <GripVertical className="size-4" />
                          </button>
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-medium">{rule.label[langKey]}</span>
                              <input
                                type="checkbox"
                                className="size-4 shrink-0 rounded border border-input accent-primary"
                                checked={rule.enabled}
                                onChange={(e) => {
                                  const v = e.target.checked;
                                  setModel((m) => ({
                                    ...m,
                                    sortingRules: m.sortingRules.map((r) =>
                                      r.id === rule.id ? { ...r, enabled: v } : r,
                                    ),
                                  }));
                                }}
                              />
                            </div>
                            {rule.id === "open_matching_tasks" && (
                              <div className="space-y-3 border-t border-border/60 pt-3">
                                <p className="text-xs text-muted-foreground">
                                  {t("settingsSortingRuleTaskBoostHint")}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {TASK_TEMPLATE_KEYS.map((key) => (
                                    <label
                                      key={key}
                                      className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm ring-1 ring-transparent hover:bg-muted/50 hover:ring-foreground/10"
                                    >
                                      <input
                                        type="checkbox"
                                        className="size-3.5 shrink-0 rounded border border-input accent-primary"
                                        checked={(rule.taskTemplateKeys ?? []).includes(key)}
                                        onChange={(e) => toggleOpenTaskTemplateKey(key, e.target.checked)}
                                      />
                                      <span className="leading-snug">{t(TASK_TEMPLATE_LABEL_KEYS[key])}</span>
                                    </label>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm">
                                  <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                      type="radio"
                                      name="open-task-match"
                                      className="size-4 accent-primary"
                                      checked={(rule.taskOpenMatch ?? "any") === "any"}
                                      onChange={() => setOpenTaskMatch("any")}
                                    />
                                    {t("settingsTaskOpenMatchAny")}
                                  </label>
                                  <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                      type="radio"
                                      name="open-task-match"
                                      className="size-4 accent-primary"
                                      checked={(rule.taskOpenMatch ?? "any") === "all"}
                                      onChange={() => setOpenTaskMatch("all")}
                                    />
                                    {t("settingsTaskOpenMatchAll")}
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="size-5 text-primary" />
                    {t("settingsSectionPriority")}
                  </CardTitle>
                  <CardDescription>{t("settingsPriorityDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg p-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
                    <Label htmlFor="pr1" className="cursor-pointer font-normal">
                      {t("settingsPriorityEmailTreatmentLow")}
                    </Label>
                    <input
                      id="pr1"
                      type="checkbox"
                      className="size-4 shrink-0 rounded border border-input accent-primary"
                      checked={model.leadPriority.emailAndTreatmentIsLow}
                      onChange={(e) => patch({ leadPriority: { emailAndTreatmentIsLow: e.target.checked } })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg p-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
                    <Label htmlFor="pr2" className="cursor-pointer font-normal">
                      {t("settingsPriorityPhoneNormal")}
                    </Label>
                    <input
                      id="pr2"
                      type="checkbox"
                      className="size-4 shrink-0 rounded border border-input accent-primary"
                      checked={model.leadPriority.withPhoneBumpsToNormal}
                      onChange={(e) => patch({ leadPriority: { withPhoneBumpsToNormal: e.target.checked } })}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg p-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/50">
                    <Label htmlFor="pr3" className="cursor-pointer font-normal">
                      {t("settingsPriorityTravelHot")}
                    </Label>
                    <input
                      id="pr3"
                      type="checkbox"
                      className="size-4 shrink-0 rounded border border-input accent-primary"
                      checked={model.leadPriority.withTravelFieldsBumpsToHot}
                      onChange={(e) => patch({ leadPriority: { withTravelFieldsBumpsToHot: e.target.checked } })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-muted-foreground">{t("settingsTasksTabIntro")}</p>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="size-5 text-primary" />
                      {t("settingsSectionGates")}
                    </CardTitle>
                    <CardDescription>{t("settingsGatesDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg p-2 ring-1 ring-transparent transition-colors hover:bg-muted/50 hover:ring-foreground/10">
                      <Label htmlFor="rq" className="cursor-pointer font-normal">
                        {t("settingsRequireQualification")}
                      </Label>
                      <input
                        id="rq"
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-input accent-primary"
                        checked={model.quotationTaskGates.requireQualification}
                        onChange={(e) => patch({ quotationTaskGates: { requireQualification: e.target.checked } })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between rounded-lg p-2 ring-1 ring-transparent transition-colors hover:bg-muted/50 hover:ring-foreground/10">
                      <Label htmlFor="rd" className="cursor-pointer font-normal">
                        {t("settingsRequireDocuments")}
                      </Label>
                      <input
                        id="rd"
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-input accent-primary"
                        checked={model.quotationTaskGates.requireDocuments}
                        onChange={(e) => patch({ quotationTaskGates: { requireDocuments: e.target.checked } })}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between rounded-lg p-2 ring-1 ring-transparent transition-colors hover:bg-muted/50 hover:ring-foreground/10">
                      <Label htmlFor="ri" className="cursor-pointer font-normal">
                        {t("settingsRequireInitialConsultation")}
                      </Label>
                      <input
                        id="ri"
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-input accent-primary"
                        checked={model.quotationTaskGates.requireInitialConsultation}
                        onChange={(e) =>
                          patch({ quotationTaskGates: { requireInitialConsultation: e.target.checked } })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListTodo className="size-5 text-primary" />
                      {t("settingsSectionTaskRules")}
                    </CardTitle>
                    <CardDescription>{t("settingsTaskRulesDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg p-2 ring-1 ring-transparent transition-colors hover:bg-muted/50 hover:ring-foreground/10">
                      <Label htmlFor="tr1" className="cursor-pointer font-normal">
                        {t("settingsSpawnCollect")}
                      </Label>
                      <input
                        id="tr1"
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-input accent-primary"
                        checked={model.taskRules.spawnCollectWhenMandatoryDocsMissing}
                        onChange={(e) =>
                          patch({ taskRules: { spawnCollectWhenMandatoryDocsMissing: e.target.checked } })
                        }
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between rounded-lg p-2 ring-1 ring-transparent transition-colors hover:bg-muted/50 hover:ring-foreground/10">
                      <Label htmlFor="tr2" className="cursor-pointer font-normal">
                        {t("settingsSpawnInitial")}
                      </Label>
                      <input
                        id="tr2"
                        type="checkbox"
                        className="size-4 shrink-0 rounded border border-input accent-primary"
                        checked={model.taskRules.spawnInitialConsultation}
                        onChange={(e) => patch({ taskRules: { spawnInitialConsultation: e.target.checked } })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-muted-foreground">{t("settingsCostsTabIntro")}</p>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="size-5 text-primary" />
                      {t("settingsSectionBands")}
                    </CardTitle>
                    <CardDescription>{t("settingsCostBandsDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {(["flight", "accommodation", "transport", "treatment"] as const).map((k) => (
                      <div key={k} className="space-y-4 rounded-xl bg-muted/30 p-4 ring-1 ring-foreground/10">
                        <p className="text-sm font-semibold text-primary">{t(`settingsCostKind.${k}`)}</p>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t("settingsCostTierLow")}</Label>
                            <Input
                              type="number"
                              className="bg-background"
                              value={model.costBands[k].min}
                              onChange={(e) =>
                                patch({
                                  costBands: {
                                    [k]: { ...model.costBands[k], min: Number(e.target.value) || 0 },
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t("settingsCostTierMid")}</Label>
                            <Input
                              type="number"
                              className="bg-background"
                              value={model.costBands[k].mid}
                              onChange={(e) =>
                                patch({
                                  costBands: {
                                    [k]: { ...model.costBands[k], mid: Number(e.target.value) || 0 },
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">{t("settingsCostTierHigh")}</Label>
                            <Input
                              type="number"
                              className="bg-background"
                              value={model.costBands[k].max}
                              onChange={(e) =>
                                patch({
                                  costBands: {
                                    [k]: { ...model.costBands[k], max: Number(e.target.value) || 0 },
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("settingsEstimateCardTitle")}</CardTitle>
                    <CardDescription>{t("settingsEstimateCardDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      {(["regional", "medium_haul", "long_haul"] as const).map((band) => (
                        <div key={band} className="space-y-2 rounded-xl bg-muted/30 p-3 ring-1 ring-foreground/10">
                          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            {t(`settingsEstimateFlightBand.${band}`)}
                          </p>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder={t("settingsCostTierLow")}
                              value={model.estimateParameters.countryBandFlightRanges[band].min}
                              onChange={(e) =>
                                patch({
                                  estimateParameters: {
                                    countryBandFlightRanges: {
                                      [band]: {
                                        ...model.estimateParameters.countryBandFlightRanges[band],
                                        min: Number(e.target.value) || 0,
                                      },
                                    },
                                  },
                                })
                              }
                            />
                            <Input
                              type="number"
                              placeholder={t("settingsCostTierHigh")}
                              value={model.estimateParameters.countryBandFlightRanges[band].max}
                              onChange={(e) =>
                                patch({
                                  estimateParameters: {
                                    countryBandFlightRanges: {
                                      [band]: {
                                        ...model.estimateParameters.countryBandFlightRanges[band],
                                        max: Number(e.target.value) || 0,
                                      },
                                    },
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>{t("settingsEstimateDoctorPct")}</Label>
                        <Input
                          type="number"
                          value={model.estimateParameters.doctorAdjustmentPct}
                          onChange={(e) =>
                            patch({ estimateParameters: { doctorAdjustmentPct: Number(e.target.value) || 0 } })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("settingsEstimateHospitalPct")}</Label>
                        <Input
                          type="number"
                          value={model.estimateParameters.hospitalAdjustmentPct}
                          onChange={(e) =>
                            patch({ estimateParameters: { hospitalAdjustmentPct: Number(e.target.value) || 0 } })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("settingsEstimateTravelerPct")}</Label>
                        <Input
                          type="number"
                          value={model.estimateParameters.travelerAdditionalPct}
                          onChange={(e) =>
                            patch({ estimateParameters: { travelerAdditionalPct: Number(e.target.value) || 0 } })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("settingsTreatmentLogisticsTitle")}</CardTitle>
                    <CardDescription>{t("settingsTreatmentLogisticsDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(model.estimateParameters.treatmentTripCountAssumptions).map(([slug, trips]) => {
                      const n = typeof trips === "number" && trips > 0 ? trips : 6;
                      return (
                        <div
                          key={slug}
                          className="flex flex-col gap-2 rounded-xl border border-border/60 p-4 sm:flex-row sm:items-center sm:gap-4"
                        >
                          <Label className="shrink-0 font-mono text-xs text-muted-foreground sm:w-44">
                            {t("settingsTripRoutesLabel", { treatment: slug })}
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            className="max-w-[120px] bg-background"
                            value={n}
                            onChange={(e) =>
                              patch({
                                estimateParameters: {
                                  treatmentTripCountAssumptions: {
                                    ...model.estimateParameters.treatmentTripCountAssumptions,
                                    [slug]: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                                  },
                                },
                              })
                            }
                          />
                          <p className="text-xs text-muted-foreground sm:flex-1">
                            {t("settingsEstimateBaseNights", {
                              nights: computeDefaultStayNightsFromTrips(n),
                            })}
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("settingsTreatmentAreaMatrixTitle")}</CardTitle>
                    <CardDescription>{t("settingsTreatmentAreaMatrixDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-10">
                    {Object.keys(model.estimateParameters.treatmentTripCountAssumptions).map(
                      (slug) => (
                        <div
                          key={slug}
                          className="space-y-6 rounded-xl border border-border/60 bg-muted/15 p-4"
                        >
                          <p className="font-mono text-xs font-medium text-muted-foreground">
                            {slug}
                          </p>
                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-wide">
                              {t("settingsTreatmentAreaTripsSubtitle")}
                            </Label>
                            <div className="grid gap-4 sm:grid-cols-3">
                              {AREA_ORDER.map((zone) => (
                                <div key={`${slug}-trip-${zone}`} className="space-y-1.5">
                                  <Label className="text-[11px] text-muted-foreground">
                                    {zone === "metro"
                                      ? t("settingsAreaZoneMetroShort")
                                      : zone === "coastal"
                                        ? t("settingsAreaZoneCoastalShort")
                                        : t("settingsAreaZoneResortShort")}
                                  </Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    className="bg-background"
                                    placeholder="—"
                                    value={
                                      typeof model.estimateParameters
                                        .treatmentAreaTripCountAssumptions?.[slug]?.[
                                        zone as EstimateAreaZone
                                      ] === "number"
                                        ? model.estimateParameters
                                            .treatmentAreaTripCountAssumptions[
                                            slug
                                          ]![
                                            zone as EstimateAreaZone
                                          ]!
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value.trim();
                                      const prevMap =
                                        model.estimateParameters
                                          .treatmentAreaTripCountAssumptions ?? {};
                                      const slugMap = {
                                        ...(prevMap[slug] ?? {}),
                                      } as Partial<Record<EstimateAreaZone, number>>;
                                      if (!raw) {
                                        delete slugMap[zone];
                                      } else {
                                        const num = Math.max(
                                          1,
                                          Math.floor(Number(raw) || 1),
                                        );
                                        slugMap[zone as EstimateAreaZone] = num;
                                      }
                                      const nextRoot = { ...prevMap };
                                      if (
                                        Object.keys(slugMap).length === 0
                                      ) {
                                        delete nextRoot[slug];
                                      } else {
                                        nextRoot[slug] = slugMap as Record<
                                          EstimateAreaZone,
                                          number
                                        >;
                                      }
                                      patch({
                                        estimateParameters: {
                                          treatmentAreaTripCountAssumptions:
                                            Object.keys(nextRoot).length === 0
                                              ? {}
                                              : (nextRoot as CrmSettings["estimateParameters"]["treatmentAreaTripCountAssumptions"]),
                                        },
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs uppercase tracking-wide">
                              {t("settingsTreatmentAreaNightsSubtitle")}
                            </Label>
                            <div className="grid gap-4 sm:grid-cols-3">
                              {AREA_ORDER.map((zone) => (
                                <div key={`${slug}-night-${zone}`} className="space-y-1.5">
                                  <Label className="text-[11px] text-muted-foreground">
                                    {zone === "metro"
                                      ? t("settingsAreaZoneMetroShort")
                                      : zone === "coastal"
                                        ? t("settingsAreaZoneCoastalShort")
                                        : t("settingsAreaZoneResortShort")}
                                  </Label>
                                  <Input
                                    type="number"
                                    min={3}
                                    className="bg-background"
                                    placeholder="—"
                                    value={
                                      typeof model.estimateParameters
                                        .treatmentAreaAccommodationNightsAssumptions?.[
                                        slug
                                      ]?.[zone as EstimateAreaZone] === "number"
                                        ? model.estimateParameters
                                            .treatmentAreaAccommodationNightsAssumptions[
                                            slug
                                          ]![
                                            zone as EstimateAreaZone
                                          ]!
                                        : ""
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value.trim();
                                      const prevMap =
                                        model.estimateParameters
                                          .treatmentAreaAccommodationNightsAssumptions ??
                                        {};
                                      const slugMap = {
                                        ...(prevMap[slug] ?? {}),
                                      } as Partial<
                                        Record<EstimateAreaZone, number>
                                      >;
                                      if (!raw) {
                                        delete slugMap[zone];
                                      } else {
                                        slugMap[
                                          zone as EstimateAreaZone
                                        ] = Math.min(
                                          90,
                                          Math.max(
                                            3,
                                            Math.floor(Number(raw) || 3),
                                          ),
                                        );
                                      }
                                      const nextRoot = { ...prevMap };
                                      if (
                                        Object.keys(slugMap).length === 0
                                      ) {
                                        delete nextRoot[slug];
                                      } else {
                                        nextRoot[slug] =
                                          slugMap as Record<
                                            EstimateAreaZone,
                                            number
                                          >;
                                      }
                                      patch({
                                        estimateParameters: {
                                          treatmentAreaAccommodationNightsAssumptions:
                                            Object.keys(nextRoot).length === 0
                                              ? {}
                                              : (nextRoot as CrmSettings["estimateParameters"]["treatmentAreaAccommodationNightsAssumptions"]),
                                        },
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent
              value="quotation-rules"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <p className="text-sm text-muted-foreground">{t("settingsQuotationRulesTabIntro")}</p>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="size-5 text-primary" />
                    {t("settingsQuotationRulesDownpaymentTitle")}
                  </CardTitle>
                  <CardDescription>{t("settingsQuotationRulesDownpaymentDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dp-pct-b2c" className="text-sm font-medium">
                      {t("settingsQuotationRulesDownpaymentLabel")}
                    </Label>
                    <div className="flex max-w-xs items-center gap-2">
                      <Input
                        id="dp-pct-b2c"
                        type="number"
                        min={0}
                        max={100}
                        className="bg-background"
                        value={model.quotationRules.downpaymentPercentB2c}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          const v = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
                          patch({ quotationRules: { downpaymentPercentB2c: v } });
                        }}
                      />
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("settingsQuotationRulesDownpaymentHint")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CircleDollarSign className="size-5 text-primary" />
                    {t("settingsQuotationRulesCommissionTitle")}
                  </CardTitle>
                  <CardDescription>{t("settingsQuotationRulesCommissionDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="qx-doc-pct" className="text-sm font-medium">
                      {t("settingsQuotationRulesDoctorCommissionLabel")}
                    </Label>
                    <div className="flex max-w-xs items-center gap-2">
                      <Input
                        id="qx-doc-pct"
                        type="number"
                        min={0}
                        max={100}
                        className="bg-background"
                        value={model.quotationRules.doctorOutCommissionPercent}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          const v = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
                          patch({ quotationRules: { doctorOutCommissionPercent: v } });
                        }}
                      />
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="qx-hosp-pct" className="text-sm font-medium">
                      {t("settingsQuotationRulesHospitalCommissionLabel")}
                    </Label>
                    <div className="flex max-w-xs items-center gap-2">
                      <Input
                        id="qx-hosp-pct"
                        type="number"
                        min={0}
                        max={100}
                        className="bg-background"
                        value={model.quotationRules.hospitalOutCommissionPercent}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          const v = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
                          patch({ quotationRules: { hospitalOutCommissionPercent: v } });
                        }}
                      />
                      <span className="text-sm font-medium text-muted-foreground">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("settingsQuotationRulesCommissionHint")}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reminders" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-sm text-muted-foreground">{t("settingsRemindersTabIntro")}</p>

              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="size-5 text-primary" />
                    {t("settingsQuoteExpiryTitle")}
                  </CardTitle>
                  <CardDescription>{t("settingsQuoteExpiryDescription")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("settingsQuoteExpiryDaysLabel")}</Label>
                    <Input
                      className="max-w-xs"
                      type="number"
                      value={model.quotationTtl.daysUntilExpiry}
                      onChange={(e) =>
                        patch({
                          quotationTtl: { daysUntilExpiry: Number(e.target.value) || 0 },
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground">{t("settingsQuoteExpiryDaysHint")}</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t("settingsQuoteWarningOffsetsLabel")}</Label>
                    <Input
                      className="max-w-md"
                      value={model.quotationTtl.warningOffsets.join(", ")}
                      onChange={(e) => {
                        const arr = e.target.value
                          .split(",")
                          .map((s) => Number(s.trim()))
                          .filter((n) => !Number.isNaN(n));
                        patch({ quotationTtl: { warningOffsets: arr.length ? arr : [0] } });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">{t("settingsQuoteWarningOffsetsHint")}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="size-5 text-primary" />
                    {t("settingsFollowUpSequencesTitle")}
                  </CardTitle>
                  <CardDescription>{t("settingsFollowUpSequencesDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                            {t("settingsNurtureColOrder")}
                          </th>
                          <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                            {t("settingsNurtureColDelay")}
                          </th>
                          <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                            {t("settingsNurtureColChannel")}
                          </th>
                          <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                            {t("settingsNurtureColTemplate")}
                          </th>
                          <th className="px-4 py-3 text-end font-medium text-muted-foreground">
                            {t("settingsNurtureColEnabled")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {model.contactNurture.rules.map((r) => (
                          <tr key={r.id} className="transition-colors hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{r.order + 1}</td>
                            <td className="px-4 py-3">{t("settingsNurtureDelayDays", { days: r.delayDays })}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                                {r.channel}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.templateKey}</td>
                            <td className="px-4 py-3 text-end">
                              <input
                                type="checkbox"
                                className="size-4 rounded border border-input accent-primary"
                                checked={r.enabled}
                                onChange={(e) => {
                                  const v = e.target.checked;
                                  setModel((m): CrmSettings => ({
                                    ...m,
                                    contactNurture: {
                                      rules: m.contactNurture.rules.map((x) =>
                                        x.id === r.id ? { ...x, enabled: v } : x,
                                      ),
                                    },
                                  }));
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
