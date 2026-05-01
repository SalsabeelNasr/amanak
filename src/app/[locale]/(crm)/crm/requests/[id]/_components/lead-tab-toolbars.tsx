"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/types";
import { leadCanCreateQuotation } from "./lead-quotation-wizard-dialog";
import {
  type LeadDetailTabId,
  type LeadConversationFilter,
  type LeadTasksSubtabFilter,
  type LeadQuotationsTabFilter,
} from "./lead-detail-types";
import type { Quotation } from "@/types";

const QUOTATION_STATUS_FILTERS: Quotation["status"][] = [
  "draft",
  "pending_admin",
  "sent_to_patient",
  "accepted",
  "rejected",
  "expired",
];
import type { LeadAppointmentsTabFilter } from "./lead-appointments-tab";
import type { LeadDocumentsTabFilter } from "./lead-documents-tab";

type LeadTabToolbarsProps = {
  activeTab: LeadDetailTabId;
  isAuthenticated: boolean;
  lead: Lead;
  conversationFilter: LeadConversationFilter;
  onConversationFilter: (f: LeadConversationFilter) => void;
  onOpenCommunicate: () => void;
  tasksTabFilter: LeadTasksSubtabFilter;
  onTasksFilter: (f: LeadTasksSubtabFilter) => void;
  onOpenTaskAdd: () => void;
  appointmentTabFilter: LeadAppointmentsTabFilter;
  onAppointmentFilter: (f: LeadAppointmentsTabFilter) => void;
  onOpenAddAppointment: () => void;
  documentsTabFilter: LeadDocumentsTabFilter;
  onDocumentsFilter: (f: LeadDocumentsTabFilter) => void;
  onOpenDocumentUpload: () => void;
  quotationsTabFilter: LeadQuotationsTabFilter;
  onQuotationsFilter: (f: LeadQuotationsTabFilter) => void;
  onOpenQuotationWizard: () => void;
};

export function LeadTabToolbars({
  activeTab,
  isAuthenticated,
  lead,
  conversationFilter,
  onConversationFilter,
  onOpenCommunicate,
  tasksTabFilter,
  onTasksFilter,
  onOpenTaskAdd,
  appointmentTabFilter,
  onAppointmentFilter,
  onOpenAddAppointment,
  documentsTabFilter,
  onDocumentsFilter,
  onOpenDocumentUpload,
  quotationsTabFilter,
  onQuotationsFilter,
  onOpenQuotationWizard,
}: LeadTabToolbarsProps) {
  const t = useTranslations("crm");

  if (activeTab === "conversations") {
    return (
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
              onClick={() => onConversationFilter(id)}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
        {isAuthenticated ? (
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
            onClick={onOpenCommunicate}
          >
            {t("convCommunicate")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (activeTab === "tasks") {
    return (
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
              onClick={() => onTasksFilter(id)}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
        {isAuthenticated ? (
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
            onClick={onOpenTaskAdd}
          >
            {t("taskAdd")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (activeTab === "appointments") {
    return (
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
              onClick={() => onAppointmentFilter(id)}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
        {isAuthenticated ? (
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
            onClick={onOpenAddAppointment}
          >
            {t("apptAdd")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (activeTab === "files") {
    return (
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
              onClick={() => onDocumentsFilter(id)}
            >
              {t(labelKey)}
            </Button>
          ))}
        </div>
        {isAuthenticated ? (
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
            onClick={onOpenDocumentUpload}
          >
            {t("docUpload")}
          </Button>
        ) : null}
      </div>
    );
  }

  if (activeTab === "quotes") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("quotesFiltersAria")}>
          <Button
            type="button"
            size="sm"
            variant={quotationsTabFilter === "all" ? "default" : "outline"}
            className="h-8 rounded-full px-4 text-sm font-medium transition-all"
            onClick={() => onQuotationsFilter("all")}
          >
            {t("quotesFilterAll")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={quotationsTabFilter === "active" ? "default" : "outline"}
            className="h-8 rounded-full px-4 text-sm font-medium transition-all"
            onClick={() => onQuotationsFilter("active")}
          >
            {t("quotesFilterActive")}
          </Button>
          {QUOTATION_STATUS_FILTERS.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={quotationsTabFilter === status ? "default" : "outline"}
              className="h-8 rounded-full px-4 text-sm font-medium transition-all"
              onClick={() => onQuotationsFilter(status)}
            >
              {t(
                `requestQuotation.viewStatus.${status}` as Parameters<typeof t>[0],
              )}
            </Button>
          ))}
        </div>
        {isAuthenticated ? (
          <Button
            type="button"
            size="sm"
            disabled={!leadCanCreateQuotation(lead)}
            className="h-8 shrink-0 rounded-xl px-4 text-sm font-semibold shadow-sm"
            onClick={onOpenQuotationWizard}
          >
            {t("requestQuotation.createButton")}
          </Button>
        ) : null}
      </div>
    );
  }

  return null;
}
