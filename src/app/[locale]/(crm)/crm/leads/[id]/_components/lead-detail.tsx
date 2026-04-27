"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadCommunicateDialog } from "./lead-communicate-dialog";
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
import { LeadHeader } from "./lead-header";
import { LeadOverviewTab } from "./tabs/lead-overview-tab";
import { LeadConversationsTab } from "./tabs/lead-conversations-tab";
import { LeadQuotationsTab } from "./tabs/lead-quotations-tab";
import { LeadTasksTab } from "./tabs/lead-tasks-tab";
import { applyTransition, getAvailableTransitions } from "@/lib/services/state-machine.service";
import { crm } from "@/lib/crm/client";
import {
  LeadModalsProvider,
  useLeadModals,
} from "@/lib/crm/hooks/use-lead-modals";
import { sortLeadTasksForDisplay } from "@/lib/crm/client.types";
import { useSession } from "@/lib/mock-session";
import type {
  ConsultationSlot,
  Lead,
  LeadConversationItem,
  Quotation,
  StateTransition,
} from "@/types";
import {
  type LeadDetailTabId,
  LEAD_DETAIL_TAB_IDS,
  type LeadConversationFilter,
  type LeadTasksSubtabFilter,
} from "./lead-detail-types";

function LeadDetailContent({
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
  const locale = useLocale();
  const { session } = useSession();
  const modals = useLeadModals();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [tab, setTab] = useState<LeadDetailTabId>("overview");
  const [pendingTransition, setPendingTransition] = useState<StateTransition | null>(null);
  const [note, setNote] = useState("");
  const [successFlash, setSuccessFlash] = useState(false);
  const [conversationFilter, setConversationFilter] =
    useState<LeadConversationFilter>("all");
  const [expandedConversationIds, setExpandedConversationIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [taskActionError, setTaskActionError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tasksTabFilter, setTasksTabFilter] = useState<LeadTasksSubtabFilter>("all");
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [documentsTabFilter, setDocumentsTabFilter] =
    useState<LeadDocumentsTabFilter>("all");
  const [appointmentTabFilter, setAppointmentTabFilter] =
    useState<LeadAppointmentsTabFilter>("all");
  const [conversations, setConversations] =
    useState<LeadConversationItem[]>(initialConversations);
  const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
  const [quotationWizardKey, setQuotationWizardKey] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const documentsTabRef = useRef<LeadDocumentsTabRef>(null);
  const appointmentsTabRef = useRef<LeadAppointmentsTabRef>(null);

  const taskDetailOpen = modals.state.open === "task-detail";
  const taskDetailTaskId =
    modals.state.open === "task-detail" ? modals.state.payload.taskId : null;

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

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
    const exists = lead.tasks.some((tk) => tk.id === tid);
    if (!exists) return;
    requestAnimationFrame(() => {
      modals.openTaskDetail(tid);
      setTaskActionError(null);
      router.replace(pathname, { scroll: false });
    });
  }, [searchParams, lead.tasks, pathname, router, modals.openTaskDetail]);

  function openTaskDetail(taskId: string) {
    modals.openTaskDetail(taskId);
    setTaskActionError(null);
  }

  const toggleConversationExpanded = useCallback((id: string) => {
    setExpandedConversationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  async function handleConfirm() {
    if (!pendingTransition || !session.isAuthenticated) return;
    if (pendingTransition.requiresNote && !note.trim()) return;
    try {
      const updated = applyTransition(lead, pendingTransition.action, session.user, note.trim() || undefined);
      const persisted = await crm.leads.update(lead.id, updated, {});
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
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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

  async function handleUpdateOwner(ownerId: string) {
    if (!session.isAuthenticated) return;
    try {
      const updated = await crm.leads.update(lead.id, { ownerId }, {});
      setLead(updated);
      modals.close();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdateDueDate(date: string) {
    if (!session.isAuthenticated) return;
    try {
      const updated = await crm.leads.update(
        lead.id,
        { updatedAt: new Date(date).toISOString() },
        {},
      );
      setLead(updated);
      modals.close();
    } catch (e) {
      console.error(e);
    }
  }

  const tabLabel: Record<LeadDetailTabId, string> = {
    overview: t("tabOverview"),
    conversations: t("tabConversations"),
    quotes: t("tabQuotes"),
    files: t("tabFiles"),
    appointments: t("tabAppointments"),
    tasks: t("tabTasks"),
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
      <LeadHeader
        lead={lead}
        locale={locale}
        availableTransitions={availableTransitions}
        onPendingTransitionSelect={setPendingTransition}
        onUpdateOwner={handleUpdateOwner}
        onUpdateDueDate={handleUpdateDueDate}
      />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as LeadDetailTabId)}
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
              {LEAD_DETAIL_TAB_IDS.map((id) => (
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
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("convFiltersAria")}>
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
                  onClick={() => modals.openCommunicate()}
                >
                  {t("convCommunicate")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {tab === "tasks" ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("taskFiltersAria")}>
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
                  onClick={() => modals.openTaskAdd()}
                >
                  {t("taskAdd")}
                </Button>
              ) : null}
            </div>
          ) : null}

          {tab === "appointments" ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("apptFiltersAria")}>
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
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("docFiltersAria")}>
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
                  onClick={() => {
                    setQuotationWizardKey((k) => k + 1);
                    modals.openQuotationWizard();
                  }}
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
              open={modals.state.open === "communicate"}
              onOpenChange={(o) => {
                if (!o) modals.close();
              }}
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
                      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
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
              open={modals.state.open === "task-add"}
              onOpenChange={(o) => {
                if (!o) modals.close();
              }}
              hideTrigger
            />
            <LeadQuotationWizardDialog
              key={quotationWizardKey}
              lead={lead}
              open={modals.state.open === "quotation-wizard"}
              onOpenChange={(o) => {
                if (!o) modals.close();
              }}
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
          key={
            taskDetailOpen && taskDetailTaskId
              ? `${lead.id}-${taskDetailTaskId}-${
                  lead.tasks.find((t) => t.id === taskDetailTaskId)?.updatedAt ?? ""
                }`
              : "lead-task-detail-closed"
          }
          lead={lead}
          taskId={taskDetailTaskId}
          open={taskDetailOpen}
          onOpenChange={(o) => {
            if (!o) modals.close();
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
          <TabsContent
            value="overview"
            className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <LeadOverviewTab
              lead={lead}
              otherLeads={otherLeads}
              overviewActiveTasks={overviewActiveTasks}
              successFlash={successFlash}
              taskActionError={taskActionError}
              pendingTransition={pendingTransition}
              onPendingTransition={setPendingTransition}
              note={note}
              onNoteChange={setNote}
              onConfirmTransition={handleConfirm}
              isActivityExpanded={isActivityExpanded}
              onToggleActivityExpanded={() => setIsActivityExpanded((e) => !e)}
              onOpenTaskDetail={openTaskDetail}
              nowMs={nowMs}
            />
          </TabsContent>

          <TabsContent
            value="conversations"
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <LeadConversationsTab
              lead={lead}
              items={filteredConversations}
              conversationFilter={conversationFilter}
              expandedConversationIds={expandedConversationIds}
              onToggleExpanded={toggleConversationExpanded}
              onViewQuotation={setViewQuotation}
            />
          </TabsContent>

          <TabsContent value="quotes" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <LeadQuotationsTab
              lead={lead}
              sortedQuotations={sortedQuotations}
              onViewQuotation={setViewQuotation}
            />
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

          <TabsContent
            value="tasks"
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <LeadTasksTab
              tasks={tasksForTasksTab}
              tasksTabFilter={tasksTabFilter}
              taskActionError={taskActionError}
              onOpenTaskDetail={openTaskDetail}
              nowMs={nowMs}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export function LeadDetail(props: {
  initialLead: Lead;
  initialConversations: LeadConversationItem[];
  initialConsultationSlots: ConsultationSlot[];
  otherLeads?: Lead[];
}) {
  return (
    <LeadModalsProvider>
      <LeadDetailContent {...props} />
    </LeadModalsProvider>
  );
}
