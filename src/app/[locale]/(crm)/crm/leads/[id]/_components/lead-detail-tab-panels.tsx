"use client";

import { TabsContent } from "@/components/ui/tabs";
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
import { LeadOverviewTab } from "./tabs/lead-overview-tab";
import { LeadConversationsTab } from "./tabs/lead-conversations-tab";
import { LeadQuotationsTab } from "./tabs/lead-quotations-tab";
import { LeadTasksTab } from "./tabs/lead-tasks-tab";
import type {
  ConsultationSlot,
  Lead,
  LeadConversationItem,
  LeadTask,
  Quotation,
} from "@/types";
import { type Dispatch, type RefObject, type SetStateAction } from "react";
import type {
  LeadConversationFilter,
  LeadDetailTabId,
  LeadTasksSubtabFilter,
} from "./lead-detail-types";

type LeadDetailTabPanelsProps = {
  documentsTabRef: RefObject<LeadDocumentsTabRef | null>;
  appointmentsTabRef: RefObject<LeadAppointmentsTabRef | null>;
  initialConsultationSlots: ConsultationSlot[];
  lead: Lead;
  setLead: Dispatch<SetStateAction<Lead>>;
  otherLeads: Lead[];
  successFlash: boolean;
  taskActionError: string | null;
  onOpenTaskDetail: (taskId: string) => void;
  nowMs: number;
  setTab: (id: LeadDetailTabId) => void;
  filteredConversations: LeadConversationItem[];
  conversationFilter: LeadConversationFilter;
  expandedConversationIds: Set<string>;
  onToggleConversationExpanded: (id: string) => void;
  onViewQuotation: (q: Quotation | null) => void;
  isAuthenticatedForQuotations: boolean;
  onApproveQuotationSuccess: () => void;
  sortedQuotations: Quotation[];
  filteredQuotationsForTab: Quotation[];
  documentsTabFilter: LeadDocumentsTabFilter;
  appointmentTabFilter: LeadAppointmentsTabFilter;
  tasksForTasksTab: LeadTask[];
  tasksTabFilter: LeadTasksSubtabFilter;
};

export function LeadDetailTabPanels({
  documentsTabRef,
  appointmentsTabRef,
  initialConsultationSlots,
  lead,
  setLead,
  otherLeads,
  successFlash,
  taskActionError,
  onOpenTaskDetail,
  nowMs,
  setTab,
  filteredConversations,
  conversationFilter,
  expandedConversationIds,
  onToggleConversationExpanded,
  onViewQuotation,
  isAuthenticatedForQuotations,
  onApproveQuotationSuccess,
  sortedQuotations,
  filteredQuotationsForTab,
  documentsTabFilter,
  appointmentTabFilter,
  tasksForTasksTab,
  tasksTabFilter,
}: LeadDetailTabPanelsProps) {
  return (
    <div className="min-h-[20rem]">
      <TabsContent
        value="overview"
        className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <LeadOverviewTab
          lead={lead}
          otherLeads={otherLeads}
          successFlash={successFlash}
          taskActionError={taskActionError}
          onOpenTaskDetail={onOpenTaskDetail}
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
          onToggleExpanded={onToggleConversationExpanded}
          onViewQuotation={onViewQuotation}
        />
      </TabsContent>

      <TabsContent
        value="quotes"
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <LeadQuotationsTab
          lead={lead}
          sortedQuotations={sortedQuotations}
          displayedQuotations={filteredQuotationsForTab}
          onViewQuotation={onViewQuotation}
          isAuthenticated={isAuthenticatedForQuotations}
          setLead={setLead}
          onApproveQuotationSuccess={onApproveQuotationSuccess}
        />
      </TabsContent>

      <TabsContent
        value="files"
        className="animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
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
          onOpenTaskDetail={onOpenTaskDetail}
          nowMs={nowMs}
        />
      </TabsContent>
    </div>
  );
}
