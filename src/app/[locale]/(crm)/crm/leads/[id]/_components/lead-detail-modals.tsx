"use client";

import { LeadCommunicateDialog } from "./lead-communicate-dialog";
import { LeadAddTaskDialog } from "./lead-add-task-dialog";
import { LeadQuotationWizardDialog } from "./lead-quotation-wizard-dialog";
import { LeadQuotationViewDialog } from "./lead-quotation-view-dialog";
import { LeadTaskDetailDialog } from "./lead-task-detail-dialog";
import { useLeadModals } from "@/lib/crm/hooks/use-lead-modals";
import type {
  Lead,
  LeadConversationItem,
  MockSession,
  Quotation,
} from "@/types";
import { type Dispatch, type SetStateAction } from "react";

type LeadDetailModalsProps = {
  modals: ReturnType<typeof useLeadModals>;
  lead: Lead;
  setLead: Dispatch<SetStateAction<Lead>>;
  locale: string;
  session: MockSession;
  setConversations: Dispatch<SetStateAction<LeadConversationItem[]>>;
  viewQuotation: Quotation | null;
  onViewQuotation: Dispatch<SetStateAction<Quotation | null>>;
  quotationWizardKey: number;
  onSuccessFlash: () => void;
  onTaskError: (msg: string | null) => void;
};

export function LeadDetailModals({
  modals,
  lead,
  setLead,
  locale,
  session,
  setConversations,
  viewQuotation,
  onViewQuotation,
  quotationWizardKey,
  onSuccessFlash,
  onTaskError,
}: LeadDetailModalsProps) {
  const taskDetailOpen = modals.state.open === "task-detail";
  const taskDetailTaskId =
    modals.state.open === "task-detail" ? modals.state.payload.taskId : null;

  return (
    <>
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
            onRequestViewQuotation={(q) => onViewQuotation(q)}
            onAppended={(item) => {
              setConversations((prev) =>
                [...prev, item].sort(
                  (a, b) =>
                    new Date(b.occurredAt).getTime() -
                    new Date(a.occurredAt).getTime(),
                ),
              );
              onSuccessFlash();
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
              onSuccessFlash();
            }}
          />
        </>
      ) : null}

      <LeadQuotationViewDialog
        open={viewQuotation !== null}
        onOpenChange={(o) => {
          if (!o) onViewQuotation(null);
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
        onSuccess={onSuccessFlash}
        onError={onTaskError}
      />
    </>
  );
}
