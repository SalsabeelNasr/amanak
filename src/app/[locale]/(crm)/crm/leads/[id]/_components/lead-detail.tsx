"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { JourneyTimelineVertical } from "@/components/portal/journey-timeline-vertical";
import { LeadActivityLog } from "./lead-activity-log";
import { LeadCommunicateDialog } from "./lead-communicate-dialog";
import { InfiniteCardList } from "@/components/crm/infinite-card-list";
import { LeadAddTaskDialog } from "./lead-add-task-dialog";
import { LeadTaskDetailDialog } from "./lead-task-detail-dialog";
import {
  LeadAppointmentsTab,
  type LeadAppointmentsTabFilter,
  type LeadAppointmentsTabRef,
} from "./lead-appointments-tab";
import {
  LeadDocumentsTab,
  type LeadDocumentsTabFilter,
  type LeadDocumentsTabRef,
} from "./lead-documents-tab";
import {
  LeadQuotationWizardDialog,
  leadCanCreateQuotation,
} from "./lead-quotation-wizard-dialog";
import { LeadQuotationViewDialog } from "./lead-quotation-view-dialog";
import {
  applyTransition,
  getAvailableTransitions,
  getStatusLabel,
} from "@/lib/services/state-machine.service";
import {
  CRM_TASK_ASSIGNEE_IDS,
  sortLeadTasksForDisplay,
  updateLead,
} from "@/lib/api/leads";
import { useSession } from "@/lib/mock-session";
import type {
  ConsultationSlot,
  Lead,
  LeadConversationChannel,
  LeadConversationItem,
  LeadTask,
  Quotation,
  StateTransition,
} from "@/types";
import { cn } from "@/lib/utils";
import {
  Activity,
  Phone,
  Globe,
  Stethoscope,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  User,
  ListTodo,
  Pin,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserPlus,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type TabId =
  | "overview"
  | "conversations"
  | "quotes"
  | "files"
  | "appointments"
  | "tasks";

const TAB_IDS: TabId[] = [
  "overview",
  "conversations",
  "quotes",
  "files",
  "appointments",
  "tasks",
];

type ConversationFilter = "all" | LeadConversationChannel;

type TaskTabFilter = "all" | "active" | "completed";

const BODY_COLLAPSE_CHARS = 280;

function conversationBodyText(item: LeadConversationItem): string {
  switch (item.channel) {
    case "whatsapp":
    case "sms":
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
      return "bg-primary text-primary-foreground border-transparent shadow-sm";
    case "approved":
    case "quotation_generated":
    case "contract_sent":
    case "customer_accepted":
    case "payment_verified":
      return "bg-primary/10 text-primary border-transparent shadow-sm";
    default:
      return "bg-muted text-muted-foreground border-transparent shadow-sm";
  }
}

export function LeadDetail({
  initialLead,
  initialConversations,
  initialConsultationSlots,
  otherLeads = [],
}: {
  initialLead: Lead;
  initialConversations: LeadConversationItem[];
  initialConsultationSlots: ConsultationSlot[];
  otherLeads?: Lead[];
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
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [taskDetailTaskId, setTaskDetailTaskId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tasksTabFilter, setTasksTabFilter] = useState<TaskTabFilter>("all");
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const [isDueDateDialogOpen, setIsDueDateDialogOpen] = useState(false);
  const [documentsTabFilter, setDocumentsTabFilter] =
    useState<LeadDocumentsTabFilter>("all");
  const [appointmentTabFilter, setAppointmentTabFilter] =
    useState<LeadAppointmentsTabFilter>("all");
  const [taskAddDialogOpen, setTaskAddDialogOpen] = useState(false);
  const [quotationWizardOpen, setQuotationWizardOpen] = useState(false);
  const [conversations, setConversations] =
    useState<LeadConversationItem[]>(initialConversations);
  const [communicateDialogOpen, setCommunicateDialogOpen] = useState(false);
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const documentsTabRef = useRef<LeadDocumentsTabRef>(null);
  const appointmentsTabRef = useRef<LeadAppointmentsTabRef>(null);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialLead.id, initialConversations]);

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

  useEffect(() => {
    const tid = searchParams.get("task");
    if (!tid) return;
    const exists = lead.tasks.some((t) => t.id === tid);
    if (exists) {
      setTaskDetailTaskId(tid);
      setTaskDetailOpen(true);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, lead.tasks, pathname, router]);

  function openTaskDetail(taskId: string) {
    setTaskDetailTaskId(taskId);
    setTaskDetailOpen(true);
    setTaskActionError(null);
  }

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

  const sortedQuotations = useMemo(
    () =>
      [...lead.quotations].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [lead.quotations],
  );

  const filteredConversations = useMemo(() => {
    if (conversationFilter === "all") return conversations;
    return conversations.filter((i) => i.channel === conversationFilter);
  }, [conversations, conversationFilter]);

  const sortedTasks = useMemo(
    () => sortLeadTasksForDisplay(lead.tasks),
    [lead.tasks],
  );

  const overviewActiveTasks = useMemo(
    () => sortedTasks.filter((task) => !task.completed),
    [sortedTasks],
  );

  const tasksForTasksTab = useMemo(() => {
    if (tasksTabFilter === "all") return sortedTasks;
    if (tasksTabFilter === "active")
      return sortedTasks.filter((task) => !task.completed);
    return sortedTasks.filter((task) => task.completed);
  }, [sortedTasks, tasksTabFilter]);

  /** Resolves CRM person id to display name (used for lead owner and task assignee). */
  function crmTeamMemberName(id: string | undefined): string {
    if (!id) return t("taskAssigneeNone");
    return t(`taskAssignees.${id}` as Parameters<typeof t>[0]);
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

  async function handleUpdateOwner(ownerId: string) {
    if (!session.isAuthenticated) return;
    try {
      const updated = await updateLead(lead.id, { ownerId });
      setLead(updated);
      setIsOwnerDialogOpen(false);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdateDueDate(date: string) {
    if (!session.isAuthenticated) return;
    try {
      // For now we'll update the updatedAt as a proxy for a main lead due date if one existed, 
      // or we can just update the lead. In this mock, leads don't have a top-level dueAt, 
      // but we can simulate it by updating the lead.
      const updated = await updateLead(lead.id, { updatedAt: new Date(date).toISOString() });
      setLead(updated);
      setIsDueDateDialogOpen(false);
    } catch (e) {
      console.error(e);
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
    conversations: t("tabConversations"),
    quotes: t("tabQuotes"),
    files: t("tabFiles"),
    appointments: t("tabAppointments"),
    tasks: t("tabTasks"),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="amanak-app-page-title">{lead.patientName}</h1>
              <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                <button
                  type="button"
                  className="group"
                  onClick={() => setIsStatusDialogOpen(true)}
                >
                  <Badge
                    className={cn(
                      "cursor-pointer px-2 py-0.5 text-xs font-semibold tracking-tight shadow-sm ring-1 ring-black/5 transition-all group-hover:ring-primary/50",
                      statusOverviewClass(lead.status),
                    )}
                  >
                    {getStatusLabel(lead.status)[langKey]}
                    <ChevronDown className="ms-1 size-2.5 opacity-50 transition-transform group-hover:translate-y-0.5" />
                  </Badge>
                </button>
                <DialogContent
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  size="sm"
                  layout="scrollable"
                >
                  <DialogHeader>
                    <DialogTitle>{t("changeStatus")}</DialogTitle>
                  </DialogHeader>
                  <DialogBody className="grid gap-2 py-4">
                    {availableTransitions.length === 0 ? (
                      <p className="py-4 text-center text-xs text-muted-foreground">{t("noActions")}</p>
                    ) : (
                      availableTransitions.map((tr) => (
                        <Button
                          key={tr.action}
                          variant="outline"
                          className="justify-start text-sm font-medium"
                          onClick={() => {
                            setPendingTransition(tr);
                            setIsStatusDialogOpen(false);
                          }}
                        >
                          {tr.label[langKey]}
                        </Button>
                      ))
                    )}
                  </DialogBody>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border/40 pt-4 sm:border-t-0 sm:pt-0">
            <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl border-border/60 px-4 text-sm font-medium hover:bg-muted"
                onClick={() => setIsOwnerDialogOpen(true)}
              >
                <UserPlus className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{t("owner")}:</span>
                <span className="text-foreground">{crmTeamMemberName(lead.ownerId)}</span>
                <ChevronDown className="size-3 opacity-40" />
              </Button>
              <DialogContent
                dir={locale === "ar" ? "rtl" : "ltr"}
                size="xs"
                layout="scrollable"
              >
                <DialogHeader>
                  <DialogTitle>{t("changeOwner")}</DialogTitle>
                </DialogHeader>
                <DialogBody className="grid gap-2 py-4">
                  {CRM_TASK_ASSIGNEE_IDS.map((id) => (
                    <Button
                      key={id}
                      variant={lead.ownerId === id ? "default" : "outline"}
                      className="justify-start text-sm font-medium"
                      onClick={() => handleUpdateOwner(id)}
                    >
                      {t(`taskAssignees.${id}` as Parameters<typeof t>[0])}
                    </Button>
                  ))}
                </DialogBody>
              </DialogContent>
            </Dialog>

            <Dialog open={isDueDateDialogOpen} onOpenChange={setIsDueDateDialogOpen}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl border-border/60 px-4 text-sm font-medium hover:bg-muted"
                onClick={() => setIsDueDateDialogOpen(true)}
              >
                <Clock className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{t("dueDate")}:</span>
                <span className="text-foreground">{formatDueDate(lead.updatedAt, locale)}</span>
                <ChevronDown className="size-3 opacity-40" />
              </Button>
              <DialogContent
                dir={locale === "ar" ? "rtl" : "ltr"}
                size="xs"
                layout="scrollable"
              >
                <DialogHeader>
                  <DialogTitle>{t("changeDueDate")}</DialogTitle>
                </DialogHeader>
                <DialogBody className="py-4">
                  <Input
                    type="date"
                    className="rounded-xl"
                    onChange={(e) => e.target.value && handleUpdateDueDate(e.target.value)}
                  />
                </DialogBody>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as TabId)}
        className="space-y-4"
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <div className="space-y-3">
          <div className="relative -mx-4 overflow-x-auto overscroll-x-contain border-b border-border/60 px-4 pb-px sm:mx-0 sm:px-0">
            <TabsList
              variant="underline"
              className="flex w-max min-w-full justify-start gap-2 border-0 bg-transparent p-0"
              aria-label={t("leadDetailTabsAria")}
            >
              {TAB_IDS.map((id) => (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="h-11 shrink-0 px-4 text-sm font-medium tracking-tight transition-all hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary"
                >
                  {tabLabel[id]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {tab === "conversations" ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
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
                    ["sms", "convFilterSms"],
                  ] as const
                ).map(([id, labelKey]) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={conversationFilter === id ? "default" : "outline"}
                    className="h-8 rounded-full px-4 text-sm font-medium transition-all"
                    onClick={() => setConversationFilter(id)}
                  >
                    {t(labelKey)}
                  </Button>
                ))}
              </div>
              {session.isAuthenticated ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
                  onClick={() => setCommunicateDialogOpen(true)}
                >
                  {t("convCommunicate")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {tab === "tasks" ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t("taskFiltersAria")}
              >
                {(
                  [
                    ["all", "taskFilterAll"],
                    ["active", "taskFilterActive"],
                    ["completed", "taskFilterCompleted"],
                  ] as const
                ).map(([id, labelKey]) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={tasksTabFilter === id ? "default" : "outline"}
                    className="h-8 rounded-full px-4 text-sm font-medium transition-all"
                    onClick={() => setTasksTabFilter(id)}
                  >
                    {t(labelKey)}
                  </Button>
                ))}
              </div>
              {session.isAuthenticated ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
                  onClick={() => setTaskAddDialogOpen(true)}
                >
                  {t("taskAdd")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {tab === "appointments" ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t("apptFiltersAria")}
              >
                {(
                  [
                    ["all", "apptFilterAll"],
                    ["treatment", "apptFilterTreatment"],
                    ["online_meeting", "apptFilterOnline"],
                    ["team_consultation", "apptFilterConsultation"],
                  ] as const
                ).map(([id, labelKey]) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={appointmentTabFilter === id ? "default" : "outline"}
                    className="h-8 rounded-full px-4 text-sm font-medium transition-all"
                    onClick={() => setAppointmentTabFilter(id)}
                  >
                    {t(labelKey)}
                  </Button>
                ))}
              </div>
              {session.isAuthenticated ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
                  onClick={() => appointmentsTabRef.current?.openAddModal()}
                >
                  {t("apptAdd")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {tab === "files" ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t("docFiltersAria")}
              >
                {(
                  [
                    ["all", "docFilterAll"],
                    ["pending", "docFilterPending"],
                    ["uploaded", "docFilterUploaded"],
                    ["verified", "docFilterVerified"],
                  ] as const
                ).map(([id, labelKey]) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={documentsTabFilter === id ? "default" : "outline"}
                    className="h-8 rounded-full px-4 text-sm font-medium transition-all"
                    onClick={() => setDocumentsTabFilter(id)}
                  >
                    {t(labelKey)}
                  </Button>
                ))}
              </div>
              {session.isAuthenticated ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
                  onClick={() => documentsTabRef.current?.openUpload()}
                >
                  {t("docUpload")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {tab === "quotes" ? (
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
              {session.isAuthenticated ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={!leadCanCreateQuotation(lead)}
                  className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
                  onClick={() => setQuotationWizardOpen(true)}
                >
                  {t("leadQuotation.createButton")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {session.isAuthenticated ? (
          <>
            <LeadCommunicateDialog
              open={communicateDialogOpen}
              onOpenChange={setCommunicateDialogOpen}
              lead={lead}
              locale={locale}
              actorEmail={session.user.email}
              isAuthenticated={session.isAuthenticated}
              quotations={lead.quotations}
              onRequestViewQuotation={(q) => setViewQuotation(q)}
              onAppended={(item) => {
                setConversations((prev) =>
                  [...prev, item].sort(
                    (a, b) =>
                      new Date(b.occurredAt).getTime() -
                      new Date(a.occurredAt).getTime(),
                  ),
                );
                setSuccessFlash(true);
              }}
            />
            <LeadAddTaskDialog
              leadId={lead.id}
              locale={locale}
              isAuthenticated={session.isAuthenticated}
              userId={session.user.id}
              onLeadUpdated={setLead}
              open={taskAddDialogOpen}
              onOpenChange={setTaskAddDialogOpen}
              hideTrigger
            />
            <LeadQuotationWizardDialog
              lead={lead}
              open={quotationWizardOpen}
              onOpenChange={setQuotationWizardOpen}
              onSaved={(next) => {
                setLead(next);
                setSuccessFlash(true);
              }}
            />
          </>
        ) : null}

        <LeadQuotationViewDialog
          open={viewQuotation !== null}
          onOpenChange={(o) => {
            if (!o) setViewQuotation(null);
          }}
          quotation={viewQuotation}
          locale={locale}
        />

        <LeadTaskDetailDialog
          lead={lead}
          taskId={taskDetailTaskId}
          open={taskDetailOpen}
          onOpenChange={(o) => {
            setTaskDetailOpen(o);
            if (!o) setTaskDetailTaskId(null);
          }}
          locale={locale}
          isAuthenticated={session.isAuthenticated}
          user={
            session.isAuthenticated
              ? session.user
              : { id: "_", name: "", role: "admin", email: "" }
          }
          onLeadUpdated={setLead}
          onSuccess={() => setSuccessFlash(true)}
          onError={setTaskActionError}
        />

        <div className="min-h-[20rem]">
          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-6 py-4">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ListTodo className="size-4" aria-hidden />
                    </div>
                    <h2 className="amanak-app-panel-title">
                      {t("activeTasksSectionTitle")}
                    </h2>
                  </div>
                  <div className="space-y-5 p-6">
                    {successFlash ? (
                      <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-xs font-bold text-success animate-in fade-in slide-in-from-top-1">
                        <CheckCircle2 className="size-4" aria-hidden />
                        {t("updated")}
                      </div>
                    ) : null}

                    {taskActionError ? (
                      <div
                        className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive"
                        role="alert"
                      >
                        {taskActionError}
                      </div>
                    ) : null}

                    {overviewActiveTasks.length === 0 ? (
                      <div className="py-12 text-center">
                        <ListTodo className="mx-auto mb-3 size-10 text-muted-foreground/20" aria-hidden />
                        <p className="text-xs font-medium text-muted-foreground">{t("noActiveTasks")}</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {overviewActiveTasks.map((taskItem) => {
                          const badge = dueBadge(taskItem);
                          const autoBadge = taskSourceBadge(taskItem);
                          return (
                            <li key={taskItem.id}>
                              <button
                                type="button"
                                onClick={() => openTaskDetail(taskItem.id)}
                                className="group flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-4 text-start shadow-sm ring-1 ring-black/5 transition-all hover:bg-muted/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <p className="amanak-app-value">{taskItem.title}</p>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    {autoBadge ? (
                                      <Badge
                                        variant="outline"
                                        className={cn("px-2 py-0.5 text-xs font-medium", autoBadge.className)}
                                      >
                                        {autoBadge.label}
                                      </Badge>
                                    ) : null}
                                    {badge ? (
                                      <Badge
                                        variant="outline"
                                        className={cn("px-2 py-0.5 text-xs font-medium", badge.className)}
                                      >
                                        {badge.label}
                                      </Badge>
                                    ) : null}
                                    <p className="amanak-app-field-label shrink-0">
                                      {t("taskAssigneeLabel")}:{" "}
                                      {crmTeamMemberName(taskItem.assigneeId)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center self-start sm:self-center">
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100">
                                    {t("taskViewDetails")}
                                    <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
                                  </span>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {pendingTransition ? (
                      <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-primary">
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
                          <div className="space-y-2.5">
                            <Label
                              htmlFor="action-note"
                              className="amanak-app-field-label"
                            >
                              {t("addNote")}
                            </Label>
                            <textarea
                              id="action-note"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="..."
                              className="min-h-[100px] w-full resize-none rounded-xl border border-border bg-background p-4 text-sm font-medium transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                            />
                          </div>
                        ) : null}

                        <div className="flex gap-3">
                          <Button
                            type="button"
                            size="sm"
                            className="h-10 flex-1 rounded-xl text-sm font-semibold shadow-md"
                            onClick={handleConfirm}
                            disabled={pendingTransition.requiresNote && !note.trim()}
                          >
                            {t("confirm")}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-10 rounded-xl text-sm font-medium"
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

                <LeadActivityLog lead={lead} />

                {otherLeads.length > 0 && (
                  <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
                    <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-6 py-4">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Users className="size-4" aria-hidden />
                      </div>
                      <h2 className="amanak-app-panel-title">
                        {t("otherLeadsByCustomer")}
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {otherLeads.map((ol) => (
                          <Link
                            key={ol.id}
                            href={`/crm/leads/${ol.id}`}
                            className="group flex flex-col gap-3 rounded-xl border border-border/40 bg-muted/10 p-4 transition-all hover:bg-muted/20 hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                                  {ol.treatmentSlug}
                                </p>
                                <p className="amanak-app-field-label">
                                  ID: {ol.id}
                                </p>
                              </div>
                              <Badge
                                className={cn(
                                  "px-2 py-0 text-xs font-semibold tracking-tight shadow-sm",
                                  statusOverviewClass(ol.status),
                                )}
                              >
                                {getStatusLabel(ol.status)[langKey]}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between border-t border-border/40 pt-3">
                              <span className="text-xs text-muted-foreground/50">
                                {formatDateTime(ol.createdAt, locale)}
                              </span>
                              <ChevronRight className="size-3 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-6">
                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center gap-2.5 border-b border-border bg-muted/30 px-6 py-4">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <User className="size-4" aria-hidden />
                    </div>
                    <h2 className="amanak-app-panel-title">
                      {tPortal("personalInfo")}
                    </h2>
                  </div>
                  <div className="space-y-5 p-6">
                    <div className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                        <Phone className="size-4 text-primary" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="amanak-app-field-label">
                          {tPortal("phone")}
                        </p>
                        <p className="amanak-app-value">{lead.patientPhone}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                        <Mail className="size-4 text-primary" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="amanak-app-field-label">{t("email")}</p>
                        <p
                          className={cn(
                            "amanak-app-value break-all",
                            !lead.patientEmail && "text-muted-foreground",
                          )}
                        >
                          {lead.patientEmail ?? t("fieldNotProvided")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                        <Users className="size-4 text-primary" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="amanak-app-field-label">{t("clientType")}</p>
                        <Badge
                          variant="outline"
                          className="mt-1 bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                          {t(
                            `clientTypes.${lead.clientType}` as Parameters<
                              typeof t
                            >[0],
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                        <Globe className="size-4 text-primary" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="amanak-app-field-label">
                          {tPortal("country")}
                        </p>
                        <p className="amanak-app-value">{lead.patientCountry}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border/50">
                        <Stethoscope className="size-4 text-primary" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="amanak-app-field-label">
                          {t("treatment")}
                        </p>
                        <p className="amanak-app-value">{lead.treatmentSlug}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
                  <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="size-4" aria-hidden />
                      </div>
                      <h2 className="amanak-app-panel-title">
                        {tPortal("journey")}
                      </h2>
                    </div>
                  </div>
                  <div className="p-6">
                    <JourneyTimelineVertical lead={lead} isExpanded={isActivityExpanded} />
                    
                    <div className="mt-4 flex justify-center border-t border-border/40 pt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group h-9 w-full gap-2 text-sm font-medium text-primary hover:bg-primary/5"
                        onClick={() => setIsActivityExpanded(!isActivityExpanded)}
                      >
                        {isActivityExpanded ? (
                          <>
                            {t("convShowLess")}
                            <ChevronUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
                          </>
                        ) : (
                          <>
                            {t("convShowMore")}
                            <ChevronDown className="size-3.5 transition-transform group-hover:translate-y-0.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="conversations"
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <InfiniteCardList
              key={conversationFilter}
              items={filteredConversations}
              getItemKey={(item) => item.id}
              initialVisible={8}
              pageSize={8}
              empty={
                <p className="py-12 text-center text-xs font-medium text-muted-foreground">
                  {conversationFilter === "all"
                    ? t("convEmptyAll")
                    : t("convEmptyChannel", {
                        channel: t(
                          conversationFilter === "whatsapp"
                            ? "convChannelWhatsapp"
                            : conversationFilter === "email"
                              ? "convChannelEmail"
                              : conversationFilter === "sms"
                                ? "convChannelSms"
                                : "convChannelCall",
                        ),
                      })}
                </p>
              }
              renderItem={(item) => {
                    const body = conversationBodyText(item);
                    const isExpanded = expandedConversationIds.has(item.id);
                    const needsCollapse = body.length > BODY_COLLAPSE_CHARS;
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
                          : item.channel === "sms"
                            ? t("convTitleSms")
                            : t("convTitleCall");

                    const ChannelIcon =
                      item.channel === "email"
                        ? Mail
                        : item.channel === "whatsapp"
                          ? MessageSquare
                          : item.channel === "sms"
                            ? Smartphone
                            : Phone;

                    const channelLabel =
                      item.channel === "whatsapp"
                        ? t("convChannelWhatsapp")
                        : item.channel === "email"
                          ? t("convChannelEmail")
                          : item.channel === "sms"
                            ? t("convChannelSms")
                            : t("convChannelCall");

                    return (
                      <div className="rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-black/5 transition-all hover:bg-muted/5">
                        <div className="flex gap-3">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background ring-1 ring-border/60">
                            <ChannelIcon
                              className="size-4 text-primary"
                              aria-hidden
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="border-primary/10 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
                              >
                                {channelLabel}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-border/60 px-2.5 py-0.5 amanak-app-field-label"
                              >
                                {directionLabel}
                              </Badge>
                              <span className="text-xs text-muted-foreground/50">
                                {formatDateTime(item.occurredAt, locale)}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-foreground">
                              {title}
                            </p>
                            {item.channel === "email" ? (
                              <div className="space-y-1 text-[11px] font-medium text-muted-foreground">
                                <p>
                                  <span className="font-medium text-foreground/60">
                                    {t("convEmailFrom")}:{" "}
                                  </span>
                                  {item.from}
                                </p>
                                <p>
                                  <span className="font-medium text-foreground/60">
                                    {t("convEmailTo")}:{" "}
                                  </span>
                                  {item.to}
                                </p>
                              </div>
                            ) : null}
                            {item.channel === "sms" && item.toPhone ? (
                              <p className="text-[11px] font-medium text-muted-foreground">
                                <span className="font-medium text-foreground/60">
                                  {t("convSmsToLabel")}:{" "}
                                </span>
                                {item.toPhone}
                              </p>
                            ) : null}
                            {item.channel === "call" &&
                            item.durationSec != null ? (
                              <p className="amanak-app-meta">
                                {t("convCallDuration", {
                                  minutes: Math.max(
                                    1,
                                    Math.round(item.durationSec / 60),
                                  ),
                                })}
                              </p>
                            ) : null}
                            {(item.channel === "whatsapp" ||
                              item.channel === "sms" ||
                              item.channel === "email") &&
                            item.attachmentHint ? (
                              <p className="text-xs font-medium text-primary/70">
                                {item.attachmentHint}
                              </p>
                            ) : null}
                            {"attachedQuotationIds" in item &&
                            item.attachedQuotationIds &&
                            item.attachedQuotationIds.length > 0 ? (
                              <div className="space-y-1.5">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {t("convAttachedQuotationsLabel")}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {item.attachedQuotationIds.map((qid) => {
                                    const q = lead.quotations.find((x) => x.id === qid);
                                    return q ? (
                                      <Button
                                        key={qid}
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="h-8 rounded-lg px-3 text-xs font-semibold"
                                        onClick={() => setViewQuotation(q)}
                                      >
                                        {t(
                                          `leadQuotation.tiers.${q.packageTier}` as Parameters<
                                            typeof t
                                          >[0],
                                        )}{" "}
                                        · v{q.version}
                                      </Button>
                                    ) : (
                                      <span
                                        key={qid}
                                        className="inline-flex items-center rounded-lg border border-dashed border-border px-2 py-1 text-xs font-medium text-muted-foreground"
                                      >
                                        {t("convUnknownQuotation")}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                            {body ? (
                              <div className="rounded-xl border border-border/40 bg-muted/30 p-4 text-[13px] font-medium leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                {shownBody}
                              </div>
                            ) : null}
                            {needsCollapse ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-sm font-medium text-primary hover:bg-primary/5"
                                onClick={() => toggleConversationExpanded(item.id)}
                              >
                                {isExpanded
                                  ? t("convShowLess")
                                  : t("convShowMore")}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  }}
            />
          </TabsContent>

          <TabsContent value="quotes" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {sortedQuotations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-16 text-center shadow-sm ring-1 ring-black/5">
                <FileCheck
                  className="mx-auto mb-4 size-12 text-muted-foreground/20"
                  aria-hidden
                />
                <p className="text-sm font-medium text-muted-foreground">
                  {t("quotesTabEmpty")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedQuotations.map((q) => {
                  const isActive = q.id === lead.activeQuotationId;
                  const tierLabel = t(
                    `leadQuotation.tiers.${q.packageTier}` as Parameters<typeof t>[0],
                  );
                  const statusLabel = t(
                    `leadQuotation.viewStatus.${q.status}` as Parameters<typeof t>[0],
                  );
                  return (
                    <section
                      key={q.id}
                      className={cn(
                        "overflow-hidden rounded-2xl border shadow-sm ring-1 ring-black/5",
                        isActive
                          ? "border-primary/30 bg-primary text-primary-foreground ring-primary/20"
                          : "border-border bg-card",
                      )}
                    >
                      <div
                        className={cn(
                          "flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6",
                          isActive ? "border-white/10 bg-white/5" : "border-border bg-muted/30",
                        )}
                      >
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <FileCheck
                            className={cn(
                              "size-4 shrink-0",
                              isActive ? "text-white" : "text-primary",
                            )}
                            aria-hidden
                          />
                          <h2
                            className={cn(
                              "truncate text-base font-semibold tracking-tight",
                              isActive ? "text-white" : "text-foreground",
                            )}
                          >
                            {tierLabel} · v{q.version}
                          </h2>
                          {isActive ? (
                            <Badge
                              variant="outline"
                              className="border-white/25 text-[10px] font-bold uppercase tracking-wide text-white"
                            >
                              {t("quotesTabActiveBadge")}
                            </Badge>
                          ) : null}
                        </div>
                        <Badge
                          variant={isActive ? "outline" : "secondary"}
                          className={cn(
                            "text-xs font-semibold",
                            isActive && "border-white/20 text-white",
                          )}
                        >
                          {statusLabel}
                        </Badge>
                      </div>
                      <div
                        className={cn(
                          "flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6",
                          !isActive && "text-foreground",
                        )}
                      >
                        <div>
                          <p
                            className={cn(
                              "mb-1 text-xs font-medium",
                              isActive ? "text-white/70" : "text-muted-foreground",
                            )}
                          >
                            {tPortal("total")}
                          </p>
                          <p
                            className={cn(
                              "text-3xl font-bold tabular-nums tracking-tight sm:text-4xl",
                              isActive ? "text-white" : "text-primary",
                            )}
                          >
                            ${q.totalUSD.toLocaleString()}
                          </p>
                          <p
                            className={cn(
                              "mt-2 text-[11px] font-medium",
                              isActive ? "text-white/60" : "text-muted-foreground",
                            )}
                          >
                            {t("quotesTabCreated")}: {formatDateTime(q.createdAt, locale)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isActive ? "secondary" : "default"}
                          className={cn(
                            "h-9 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm",
                            isActive && "bg-white text-primary hover:bg-white/90",
                          )}
                          onClick={() => setViewQuotation(q)}
                        >
                          {t("quotesTabView")}
                        </Button>
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <LeadDocumentsTab
              ref={documentsTabRef}
              lead={lead}
              onLeadUpdated={setLead}
              filter={documentsTabFilter}
              hideHeaderUpload
            />
          </TabsContent>

          <TabsContent
            value="appointments"
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <LeadAppointmentsTab
              ref={appointmentsTabRef}
              lead={lead}
              consultationSlots={initialConsultationSlots}
              onLeadUpdated={setLead}
              onOpenTasksTab={() => setTab("tasks")}
              filter={appointmentTabFilter}
              hideHeaderAdd
            />
          </TabsContent>

          <TabsContent value="tasks" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-6">
              {taskActionError ? (
                <div
                  className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-bold text-destructive"
                  role="alert"
                >
                  {taskActionError}
                </div>
              ) : null}

              <InfiniteCardList
                key={tasksTabFilter}
                items={tasksForTasksTab}
                getItemKey={(taskItem) => taskItem.id}
                initialVisible={12}
                pageSize={12}
                empty={
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {tasksTabFilter === "all"
                      ? t("taskEmpty")
                      : tasksTabFilter === "active"
                        ? t("noActiveTasks")
                        : t("noPreviousTasks")}
                  </p>
                }
                renderItem={(taskItem) => {
                      const isOpen = !taskItem.completed;
                      const badge = dueBadge(taskItem);
                      const autoBadge = isOpen ? taskSourceBadge(taskItem) : null;
                      return (
                        <button
                          type="button"
                          onClick={() => openTaskDetail(taskItem.id)}
                          className={cn(
                            "group flex w-full flex-col gap-4 rounded-xl border border-border bg-card p-4 text-start shadow-sm ring-1 ring-black/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:flex-row sm:items-center sm:justify-between",
                            isOpen
                              ? "hover:bg-muted/5"
                              : "opacity-60 grayscale-[0.5] hover:bg-muted/10",
                          )}
                        >
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex items-start gap-2">
                              {isOpen ? (
                                <span
                                  className="mt-0.5 inline-flex shrink-0 text-primary"
                                  aria-label={t("taskPinnedAria")}
                                >
                                  <Pin className="size-3.5" aria-hidden />
                                </span>
                              ) : null}
                              <p
                                className={cn(
                                  "amanak-app-value min-w-0 flex-1",
                                  !isOpen && "text-muted-foreground line-through",
                                )}
                              >
                                {taskItem.title}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "flex flex-wrap items-center gap-x-3 gap-y-1",
                                isOpen && "ms-[calc(0.875rem+0.5rem)]",
                              )}
                            >
                              {autoBadge ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium",
                                    autoBadge.className,
                                  )}
                                >
                                  {autoBadge.label}
                                </Badge>
                              ) : null}
                              {badge ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "px-2 py-0.5 text-xs font-medium",
                                    badge.className,
                                  )}
                                >
                                  {badge.label}
                                </Badge>
                              ) : null}
                              <p className="amanak-app-field-label shrink-0">
                                {t("taskAssigneeLabel")}:{" "}
                                {crmTeamMemberName(taskItem.assigneeId)}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center self-start sm:self-center">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary opacity-80 group-hover:opacity-100">
                              {t("taskViewDetails")}
                              <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
                            </span>
                          </div>
                        </button>
                      );
                    }}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
