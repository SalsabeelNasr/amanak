"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  LeadAppointmentsTabFilter,
  LeadAppointmentsTabRef,
} from "./lead-appointments-tab";
import type { LeadDocumentsTabFilter, LeadDocumentsTabRef } from "./lead-documents-tab";
import { LeadHeader } from "./lead-header";
import { LeadTabToolbars } from "./lead-tab-toolbars";
import { LeadDetailModals } from "./lead-detail-modals";
import { LeadDetailTabPanels } from "./lead-detail-tab-panels";
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

          <LeadTabToolbars
            activeTab={tab}
            isAuthenticated={session.isAuthenticated}
            lead={lead}
            conversationFilter={conversationFilter}
            onConversationFilter={setConversationFilter}
            onOpenCommunicate={() => modals.openCommunicate()}
            tasksTabFilter={tasksTabFilter}
            onTasksFilter={setTasksTabFilter}
            onOpenTaskAdd={() => modals.openTaskAdd()}
            appointmentTabFilter={appointmentTabFilter}
            onAppointmentFilter={setAppointmentTabFilter}
            onOpenAddAppointment={() => appointmentsTabRef.current?.openAddModal()}
            documentsTabFilter={documentsTabFilter}
            onDocumentsFilter={setDocumentsTabFilter}
            onOpenDocumentUpload={() => documentsTabRef.current?.openUpload()}
            onOpenQuotationWizard={() => {
              setQuotationWizardKey((k) => k + 1);
              modals.openQuotationWizard();
            }}
          />
        </div>

        <LeadDetailModals
          modals={modals}
          lead={lead}
          setLead={setLead}
          locale={locale}
          session={session}
          setConversations={setConversations}
          viewQuotation={viewQuotation}
          onViewQuotation={setViewQuotation}
          quotationWizardKey={quotationWizardKey}
          onSuccessFlash={() => setSuccessFlash(true)}
          onTaskError={setTaskActionError}
        />

        <LeadDetailTabPanels
          documentsTabRef={documentsTabRef}
          appointmentsTabRef={appointmentsTabRef}
          initialConsultationSlots={initialConsultationSlots}
          lead={lead}
          setLead={setLead}
          otherLeads={otherLeads}
          overviewActiveTasks={overviewActiveTasks}
          successFlash={successFlash}
          taskActionError={taskActionError}
          pendingTransition={pendingTransition}
          onPendingTransition={setPendingTransition}
          note={note}
          onNoteChange={setNote}
          isActivityExpanded={isActivityExpanded}
          onToggleActivityExpanded={() => setIsActivityExpanded((e) => !e)}
          onConfirmTransition={handleConfirm}
          onOpenTaskDetail={openTaskDetail}
          nowMs={nowMs}
          setTab={setTab}
          filteredConversations={filteredConversations}
          conversationFilter={conversationFilter}
          expandedConversationIds={expandedConversationIds}
          onToggleConversationExpanded={toggleConversationExpanded}
          onViewQuotation={setViewQuotation}
          sortedQuotations={sortedQuotations}
          documentsTabFilter={documentsTabFilter}
          appointmentTabFilter={appointmentTabFilter}
          tasksForTasksTab={tasksForTasksTab}
          tasksTabFilter={tasksTabFilter}
        />
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
