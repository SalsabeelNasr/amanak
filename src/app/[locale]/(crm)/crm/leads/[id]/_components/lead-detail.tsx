"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JourneyTimelineVertical } from "@/components/portal/journey-timeline-vertical";
import {
  applyTransition,
  getAvailableTransitions,
  getStatusLabel,
  isTerminalState,
} from "@/lib/services/state-machine.service";
import {
  addLeadTask,
  CRM_TASK_ASSIGNEE_IDS,
  deleteLeadTask,
  sortLeadTasksForDisplay,
  updateLead,
  updateLeadTask,
} from "@/lib/api/leads";
import { useSession } from "@/lib/mock-session";
import type {
  Lead,
  LeadConversationChannel,
  LeadConversationItem,
  LeadTask,
  StateTransition,
} from "@/types";
import { cn } from "@/lib/utils";
import {
  Activity,
  Phone,
  Globe,
  Stethoscope,
  UserCheck,
  FileText,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  FileCheck,
  User,
  Calendar,
  ListTodo,
  Mail,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type TabId =
  | "overview"
  | "activity"
  | "conversations"
  | "quotes"
  | "files"
  | "tasks";

const TAB_IDS: TabId[] = [
  "overview",
  "activity",
  "conversations",
  "quotes",
  "files",
  "tasks",
];

type ConversationFilter = "all" | LeadConversationChannel;

const BODY_COLLAPSE_CHARS = 280;

function conversationBodyText(item: LeadConversationItem): string {
  switch (item.channel) {
    case "whatsapp":
      return item.body;
    case "email":
      return item.body ?? item.snippet ?? "";
    case "call":
      return item.transcript;
  }
}

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDueDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusOverviewClass(status: Lead["status"]): string {
  switch (status) {
    case "rejected":
      return "bg-destructive/10 text-destructive border-transparent";
    case "in_treatment":
    case "post_treatment":
    case "specialized_doctor_assigned":
    case "order_created":
      return "bg-primary text-primary-foreground border-transparent";
    case "approved":
    case "quotation_generated":
    case "contract_sent":
    case "customer_accepted":
    case "payment_verified":
      return "bg-primary/10 text-primary border-transparent";
    default:
      return "bg-muted text-muted-foreground border-transparent";
  }
}

export function LeadDetail({
  initialLead,
  initialConversations,
}: {
  initialLead: Lead;
  initialConversations: LeadConversationItem[];
}) {
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const { session } = useSession();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [tab, setTab] = useState<TabId>("overview");
  const [pendingTransition, setPendingTransition] =
    useState<StateTransition | null>(null);
  const [note, setNote] = useState("");
  const [successFlash, setSuccessFlash] = useState(false);
  const [conversationFilter, setConversationFilter] =
    useState<ConversationFilter>("all");
  const [expandedConversationIds, setExpandedConversationIds] = useState<
    Set<string>
  >(() => new Set());
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);

  const availableTransitions = useMemo(
    () =>
      session.isAuthenticated
        ? getAvailableTransitions(lead.status, session.user.role)
        : [],
    [lead.status, session],
  );

  useEffect(() => {
    if (!successFlash) return;
    const timer = setTimeout(() => setSuccessFlash(false), 2000);
    return () => clearTimeout(timer);
  }, [successFlash]);

  async function handleConfirm() {
    if (!pendingTransition || !session.isAuthenticated) return;
    if (pendingTransition.requiresNote && !note.trim()) return;
    try {
      const updated = applyTransition(
        lead,
        pendingTransition.action,
        session.user,
        note.trim() || undefined,
      );
      const persisted = await updateLead(lead.id, updated);
      setLead(persisted);
      setPendingTransition(null);
      setNote("");
      setSuccessFlash(true);
    } catch (err) {
      console.error(err);
    }
  }

  const activeQuotation = lead.activeQuotationId
    ? lead.quotations.find((q) => q.id === lead.activeQuotationId)
    : undefined;

  const filteredConversations = useMemo(() => {
    if (conversationFilter === "all") return initialConversations;
    return initialConversations.filter((i) => i.channel === conversationFilter);
  }, [initialConversations, conversationFilter]);

  const sortedTasks = useMemo(
    () => sortLeadTasksForDisplay(lead.tasks),
    [lead.tasks],
  );

  function assigneeLabel(assigneeId: string | undefined): string {
    if (!assigneeId) return t("taskAssigneeNone");
    return t(`taskAssignees.${assigneeId}` as Parameters<typeof t>[0]);
  }

  function dueBadge(task: LeadTask): { label: string; className: string } | null {
    if (task.completed) {
      if (task.resolution === "cancelled") {
        return {
          label: t("taskCancelledLabel"),
          className: "border-transparent bg-destructive/15 text-destructive",
        };
      }
      return {
        label: t("taskCompletedLabel"),
        className: "border-transparent bg-muted text-muted-foreground",
      };
    }
    if (!task.dueAt) {
      return {
        label: t("taskDueNone"),
        className: "border-border/60 text-muted-foreground",
      };
    }
    const dueMs = new Date(task.dueAt).getTime();
    if (dueMs < Date.now()) {
      return {
        label: t("taskDueOverdue"),
        className: "border-transparent bg-destructive/10 text-destructive",
      };
    }
    return {
      label: formatDueDate(task.dueAt, locale),
      className: "border-primary/30 bg-primary/5 text-primary",
    };
  }

  function taskSourceBadge(task: LeadTask): { label: string; className: string } | null {
    if (task.source === "system" || task.templateKey) {
      return {
        label: t("taskSourceAuto"),
        className: "border-primary/30 bg-primary/5 text-primary",
      };
    }
    return null;
  }

  async function handleAddTask() {
    if (!session.isAuthenticated || !newTaskTitle.trim()) return;
    setTaskSaving(true);
    try {
      const dueAt = newTaskDue.trim()
        ? new Date(`${newTaskDue}T12:00:00`).toISOString()
        : undefined;
      const updated = await addLeadTask(lead.id, {
        title: newTaskTitle,
        dueAt,
        assigneeId: newTaskAssignee.trim() || undefined,
        createdByUserId: session.user.id,
      });
      setLead(updated);
      setNewTaskTitle("");
      setNewTaskDue("");
      setNewTaskAssignee("");
    } catch (e) {
      console.error(e);
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleToggleTaskComplete(task: LeadTask) {
    if (!session.isAuthenticated) return;
    setTaskSaving(true);
    try {
      const updated = await updateLeadTask(lead.id, task.id, {
        completed: !task.completed,
      });
      setLead(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!session.isAuthenticated) return;
    if (!window.confirm(t("taskDeleteConfirm"))) return;
    setTaskSaving(true);
    try {
      const updated = await deleteLeadTask(lead.id, taskId);
      setLead(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setTaskSaving(false);
    }
  }

  function toggleConversationExpanded(id: string) {
    setExpandedConversationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const tabLabel: Record<TabId, string> = {
    overview: t("tabOverview"),
    activity: t("tabActivity"),
    conversations: t("tabConversations"),
    quotes: t("tabQuotes"),
    files: t("tabFiles"),
    tasks: t("tabTasks"),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/crm/leads"
            className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="size-3 rtl:rotate-180" />
            {t("leads")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {lead.patientName}
            </h1>
            <Badge
              variant="outline"
              className="bg-muted/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            >
              {lead.clientType}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:items-end sm:text-end">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {t("status")}
          </p>
          <Badge
            className={cn(
              "w-fit px-3 py-1 text-xs font-semibold shadow-sm",
              statusOverviewClass(lead.status),
            )}
          >
            {getStatusLabel(lead.status)[langKey]}
          </Badge>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabId)}
        className="gap-6"
      >
        <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-px">
          <TabsList variant="underline" aria-label={t("leadDetailTabsAria")}>
            {TAB_IDS.map((id) => (
              <TabsTrigger key={id} value={id} className="min-w-[5.5rem] sm:min-w-0">
                {tabLabel[id]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-h-[12rem]">
          <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-200">
            <section className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t("currentStatus")}
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Badge
                  className={cn(
                    "w-fit px-3 py-1 text-sm font-semibold",
                    statusOverviewClass(lead.status),
                  )}
                >
                  {getStatusLabel(lead.status)[langKey]}
                </Badge>
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  <span>
                    {t("lastUpdatedDetail")}: {formatDateTime(lead.updatedAt, locale)}
                  </span>
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <User className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {tPortal("personalInfo")}
                </h2>
              </div>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                    <Phone className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {tPortal("phone")}
                    </p>
                    <p className="font-semibold text-foreground">{lead.patientPhone}</p>
                  </div>
                </div>
                {lead.patientEmail ? (
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                      <Mail className="size-4 text-primary" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("email")}
                      </p>
                      <p className="font-semibold text-foreground">{lead.patientEmail}</p>
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                    <Globe className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {tPortal("country")}
                    </p>
                    <p className="font-semibold text-foreground">{lead.patientCountry}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                    <Stethoscope className="size-4 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t("treatment")}
                    </p>
                    <p className="font-semibold text-foreground">{lead.treatmentSlug}</p>
                  </div>
                </div>
                {lead.assignedCsId ? (
                  <div className="flex gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                      <UserCheck className="size-4 text-primary" aria-hidden />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t("assignedCs")}
                      </p>
                      <p className="font-semibold text-foreground">{lead.assignedCsId}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <Activity className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {t("availableActions")}
                </h2>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                {successFlash ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-600 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {t("updated")}
                  </div>
                ) : null}

                {isTerminalState(lead.status) || availableTransitions.length === 0 ? (
                  <div className="py-4 text-center">
                    <Clock className="mx-auto mb-2 size-8 text-muted-foreground/20" aria-hidden />
                    <p className="text-xs text-muted-foreground">{t("noActions")}</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTransitions.map((tr) => (
                      <Button
                        key={tr.action + tr.from}
                        type="button"
                        size="sm"
                        variant={
                          pendingTransition?.action === tr.action ? "default" : "outline"
                        }
                        className={cn(
                          "rounded-full px-4 text-xs font-medium transition-all",
                          pendingTransition?.action === tr.action
                            ? "shadow-md"
                            : "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                        )}
                        onClick={() => {
                          setPendingTransition(tr);
                          setNote("");
                        }}
                      >
                        {tr.label[langKey]}
                      </Button>
                    ))}
                  </div>
                )}

                {pendingTransition ? (
                  <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        {pendingTransition.label[langKey]}
                      </p>
                      <button
                        type="button"
                        className="rounded-md text-muted-foreground transition-colors hover:text-destructive"
                        onClick={() => setPendingTransition(null)}
                        aria-label={t("cancel")}
                      >
                        <XCircle className="size-4" />
                      </button>
                    </div>

                    {pendingTransition.requiresNote ? (
                      <div className="space-y-2">
                        <Label
                          htmlFor="action-note"
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {t("addNote")}
                        </Label>
                        <textarea
                          id="action-note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="..."
                          className="min-h-20 w-full resize-none rounded-xl border border-border bg-background p-3 text-sm transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        />
                      </div>
                    ) : null}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 rounded-lg shadow-sm"
                        onClick={handleConfirm}
                        disabled={pendingTransition.requiresNote && !note.trim()}
                      >
                        {t("confirm")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={() => {
                          setPendingTransition(null);
                          setNote("");
                        }}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 animate-in fade-in duration-200">
            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <Activity className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {tPortal("journey")}
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                <JourneyTimelineVertical lead={lead} />
              </div>
            </section>

            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <History className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {t("statusHistory")}
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                {lead.statusHistory.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {t("noHistory")}
                  </p>
                ) : (
                  <div className="relative space-y-6 before:absolute before:inset-0 before:start-[11px] before:w-px before:bg-border/60">
                    {[...lead.statusHistory].reverse().map((entry, idx) => (
                      <div key={idx} className="group relative ps-8">
                        <div className="absolute start-0 top-1 z-10 flex size-[22px] items-center justify-center rounded-full border-2 border-primary/20 bg-background transition-colors group-hover:border-primary">
                          <div className="size-1.5 rounded-full bg-primary/40 transition-colors group-hover:bg-primary" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-foreground">
                              {getStatusLabel(entry.from)[langKey]} →{" "}
                              {getStatusLabel(entry.to)[langKey]}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                              {formatDateTime(entry.timestamp, locale)}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{entry.actorRole}</p>
                          {entry.note ? (
                            <div className="mt-2 rounded-lg border border-border/20 bg-muted/30 p-2 text-[11px] text-muted-foreground">
                              {entry.note}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent
            value="conversations"
            className="space-y-6 animate-in fade-in duration-200"
          >
            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border/40 bg-muted/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" aria-hidden />
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    {t("convSectionTitle")}
                  </h2>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label={t("convFiltersAria")}
                >
                  {(
                    [
                      ["all", "convFilterAll"],
                      ["whatsapp", "convFilterWhatsapp"],
                      ["email", "convFilterEmail"],
                      ["call", "convFilterCall"],
                    ] as const
                  ).map(([id, labelKey]) => (
                    <Button
                      key={id}
                      type="button"
                      size="sm"
                      variant={conversationFilter === id ? "default" : "outline"}
                      className="rounded-full px-3 text-xs font-medium"
                      onClick={() => setConversationFilter(id)}
                    >
                      {t(labelKey)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="p-5 sm:p-6">
                {filteredConversations.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    {conversationFilter === "all"
                      ? t("convEmptyAll")
                      : t("convEmptyChannel", {
                          channel: t(
                            conversationFilter === "whatsapp"
                              ? "convChannelWhatsapp"
                              : conversationFilter === "email"
                                ? "convChannelEmail"
                                : "convChannelCall",
                          ),
                        })}
                  </p>
                ) : (
                  <div className="relative space-y-6 before:absolute before:inset-0 before:start-[11px] before:w-px before:bg-border/60">
                    {filteredConversations.map((item) => {
                      const body = conversationBodyText(item);
                      const isExpanded = expandedConversationIds.has(item.id);
                      const needsCollapse =
                        body.length > BODY_COLLAPSE_CHARS;
                      const shownBody =
                        needsCollapse && !isExpanded
                          ? `${body.slice(0, BODY_COLLAPSE_CHARS).trim()}…`
                          : body;

                      const directionLabel =
                        item.direction === "inbound"
                          ? t("convDirectionInbound")
                          : item.direction === "outbound"
                            ? t("convDirectionOutbound")
                            : t("convDirectionInternal");

                      const title =
                        item.channel === "email"
                          ? item.subject
                          : item.channel === "whatsapp"
                            ? t("convTitleWhatsapp")
                            : t("convTitleCall");

                      const ChannelIcon =
                        item.channel === "email"
                          ? Mail
                          : item.channel === "whatsapp"
                            ? MessageSquare
                            : Phone;

                      const channelLabel =
                        item.channel === "whatsapp"
                          ? t("convChannelWhatsapp")
                          : item.channel === "email"
                            ? t("convChannelEmail")
                            : t("convChannelCall");

                      return (
                        <div key={item.id} className="group relative ps-8">
                          <div className="absolute start-0 top-1 z-10 flex size-[22px] items-center justify-center rounded-full border-2 border-primary/20 bg-background transition-colors group-hover:border-primary">
                            <ChannelIcon
                              className="size-3 text-primary/70"
                              aria-hidden
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="px-2 py-0 text-[10px] font-bold uppercase tracking-wide"
                              >
                                {channelLabel}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-border/60 px-2 py-0 text-[10px] font-medium text-muted-foreground"
                              >
                                {directionLabel}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground/60">
                                {formatDateTime(item.occurredAt, locale)}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-foreground">
                              {title}
                            </p>
                            {item.channel === "email" ? (
                              <div className="space-y-0.5 text-[11px] text-muted-foreground">
                                <p>
                                  <span className="font-semibold text-foreground/80">
                                    {t("convEmailFrom")}:{" "}
                                  </span>
                                  {item.from}
                                </p>
                                <p>
                                  <span className="font-semibold text-foreground/80">
                                    {t("convEmailTo")}:{" "}
                                  </span>
                                  {item.to}
                                </p>
                              </div>
                            ) : null}
                            {item.channel === "call" &&
                            item.durationSec != null ? (
                              <p className="text-[11px] text-muted-foreground">
                                {t("convCallDuration", {
                                  minutes: Math.max(
                                    1,
                                    Math.round(item.durationSec / 60),
                                  ),
                                })}
                              </p>
                            ) : null}
                            {item.channel === "whatsapp" &&
                            item.attachmentHint ? (
                              <p className="text-[11px] text-muted-foreground">
                                {item.attachmentHint}
                              </p>
                            ) : null}
                            {body ? (
                              <div className="rounded-lg border border-border/20 bg-muted/30 p-3 text-[11px] whitespace-pre-wrap text-muted-foreground">
                                {shownBody}
                              </div>
                            ) : null}
                            {needsCollapse ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-primary"
                                onClick={() => toggleConversationExpanded(item.id)}
                              >
                                {isExpanded
                                  ? t("convShowLess")
                                  : t("convShowMore")}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="quotes" className="animate-in fade-in duration-200">
            {activeQuotation ? (
              <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-2">
                    <FileCheck className="size-4" aria-hidden />
                    <h2 className="text-sm font-bold uppercase tracking-wider">
                      {t("activeQuotation")}
                    </h2>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-white/20 text-[10px] font-bold uppercase tracking-widest text-white"
                  >
                    {activeQuotation.packageTier}
                  </Badge>
                </div>
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
                        {tPortal("total")}
                      </p>
                      <p className="text-3xl font-bold tracking-tight">
                        ${activeQuotation.totalUSD.toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-white px-3 py-1 text-[10px] font-bold text-primary hover:bg-white/90">
                      {activeQuotation.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <p className="text-sm text-muted-foreground">{t("noActiveQuotation")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="animate-in fade-in duration-200">
            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <FileText className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {tPortal("documents")}
                </h2>
              </div>
              <div className="p-5 sm:p-6">
                {lead.documents.length === 0 ? (
                  <div className="py-6 text-center">
                    <FileText className="mx-auto mb-2 size-8 text-muted-foreground/20" aria-hidden />
                    <p className="text-xs text-muted-foreground">{tPortal("noDocs")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lead.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="group flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-3 transition-colors hover:bg-muted/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-background shadow-sm">
                            <FileText className="size-3.5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
                          </div>
                          <span className="text-xs font-medium text-foreground">{doc.name}</span>
                        </div>
                        {doc.status === "verified" ? (
                          <Badge className="border-transparent bg-emerald-500/10 px-2 py-0 text-[10px] text-emerald-600">
                            {tPortal("docVerified")}
                          </Badge>
                        ) : null}
                        {doc.status === "uploaded" ? (
                          <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                            {tPortal("docUploaded")}
                          </Badge>
                        ) : null}
                        {doc.status === "pending" ? (
                          <Badge
                            variant="outline"
                            className="px-2 py-0 text-[10px] text-muted-foreground"
                          >
                            {tPortal("docPending")}
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="tasks" className="animate-in fade-in duration-200">
            <section className="rounded-2xl border border-border/50 bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/5 px-5 py-4 sm:px-6">
                <ListTodo className="size-4 text-primary" aria-hidden />
                <h2 className="text-sm font-bold uppercase tracking-wider">
                  {t("tasksSectionTitle")}
                </h2>
              </div>
              <div className="space-y-6 p-5 sm:p-6">
                {session.isAuthenticated ? (
                  <div className="space-y-4 rounded-xl border border-border/40 bg-muted/10 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label
                          htmlFor="new-task-title"
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {t("taskTitleLabel")}
                        </Label>
                        <Input
                          id="new-task-title"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder={t("taskTitlePlaceholder")}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="new-task-due"
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {t("taskDueLabel")}
                        </Label>
                        <Input
                          id="new-task-due"
                          type="date"
                          value={newTaskDue}
                          onChange={(e) => setNewTaskDue(e.target.value)}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="new-task-assignee"
                          className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                        >
                          {t("taskAssigneeLabel")}
                        </Label>
                        <select
                          id="new-task-assignee"
                          value={newTaskAssignee}
                          onChange={(e) => setNewTaskAssignee(e.target.value)}
                          className={cn(
                            "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors",
                            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                            "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
                          )}
                        >
                          <option value="">{t("taskAssigneeNone")}</option>
                          {CRM_TASK_ASSIGNEE_IDS.map((id) => (
                            <option key={id} value={id}>
                              {t(`taskAssignees.${id}` as Parameters<typeof t>[0])}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-lg"
                      disabled={taskSaving || !newTaskTitle.trim()}
                      onClick={() => void handleAddTask()}
                    >
                      {t("taskSaveAdd")}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("taskLoginHint")}</p>
                )}

                {sortedTasks.length === 0 ? (
                  <div className="py-6 text-center">
                    <ListTodo className="mx-auto mb-2 size-8 text-muted-foreground/20" aria-hidden />
                    <p className="text-xs text-muted-foreground">{t("taskEmpty")}</p>
                  </div>
                ) : (
                  <ul className="space-y-3" aria-label={t("tasksSectionTitle")}>
                    {sortedTasks.map((taskItem) => {
                      const badge = dueBadge(taskItem);
                      const autoBadge = taskSourceBadge(taskItem);
                      return (
                        <li
                          key={taskItem.id}
                          className={cn(
                            "flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/10 p-3 sm:flex-row sm:items-center sm:justify-between",
                            taskItem.completed && "opacity-70",
                          )}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <p
                              className={cn(
                                "text-sm font-medium text-foreground",
                                taskItem.completed && "line-through",
                              )}
                            >
                              {taskItem.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {assigneeLabel(taskItem.assigneeId)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {autoBadge ? (
                              <Badge
                                variant="outline"
                                className={cn("text-[10px]", autoBadge.className)}
                              >
                                {autoBadge.label}
                              </Badge>
                            ) : null}
                            {badge ? (
                              <Badge variant="outline" className={cn("text-[10px]", badge.className)}>
                                {badge.label}
                              </Badge>
                            ) : null}
                            {session.isAuthenticated ? (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 rounded-lg text-xs"
                                  disabled={taskSaving}
                                  onClick={() => void handleToggleTaskComplete(taskItem)}
                                >
                                  {taskItem.completed ? t("taskReopen") : t("taskMarkComplete")}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                  disabled={taskSaving}
                                  onClick={() => void handleDeleteTask(taskItem.id)}
                                  aria-label={t("taskDelete")}
                                >
                                  <Trash2 className="size-4" aria-hidden />
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
