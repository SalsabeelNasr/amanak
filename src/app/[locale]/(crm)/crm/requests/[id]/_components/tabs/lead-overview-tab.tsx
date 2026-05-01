"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { LeadRequestDetailsCard } from "../lead-request-details-card";
import { LeadTimeline } from "../lead-timeline";
import { formatDateTime } from "@/components/crm/date-format";
import { useLangKey } from "@/components/crm/use-lang-key";
import { statusOverviewBadgeClass } from "@/components/crm/status-badge";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import type { Lead, LeadConversationItem, Patient } from "@/types";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Globe,
  Mail,
  Phone,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type LeadOverviewTabProps = {
  lead: Lead;
  patient?: Patient | null;
  conversations: LeadConversationItem[];
  otherRequests: Lead[];
  successFlash: boolean;
  taskActionError: string | null;
  onOpenTaskDetail: (taskId: string) => void;
  nowMs: number;
};

export function LeadOverviewTab({
  lead,
  patient,
  conversations,
  otherRequests,
  successFlash,
  taskActionError,
  onOpenTaskDetail,
  nowMs,
}: LeadOverviewTabProps) {
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const locale = useLocale();
  const langKey = useLangKey();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <LeadTimeline
          lead={lead}
          conversations={conversations}
          nowMs={nowMs}
          successFlash={successFlash}
          taskActionError={taskActionError}
          onOpenTaskDetail={onOpenTaskDetail}
        />

        {otherRequests.length > 0 && (
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
              <Users className="size-5 text-muted-foreground" aria-hidden />
              <h2 className="amanak-app-panel-title">{t("otherLeadsByCustomer")}</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {otherRequests.map((ol) => (
                  <Link
                    key={ol.id}
                    href={`${ROUTES.crmRequests}/${ol.id}`}
                    className="group flex flex-col gap-3 rounded-xl border border-border/50 p-4 transition-all hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {ol.treatmentSlug}
                        </p>
                        <p className="amanak-app-field-label">ID: {ol.id}</p>
                      </div>
                      <Badge
                        className={cn(
                          "px-2 py-0 text-xs font-semibold tracking-tight shadow-sm",
                          statusOverviewBadgeClass(ol.status),
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
        <LeadRequestDetailsCard lead={lead} />
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center gap-2.5 border-b border-border px-6 py-4">
            <User className="size-5 text-muted-foreground" aria-hidden />
            <h2 className="amanak-app-panel-title">{tPortal("personalInfo")}</h2>
          </div>
          <div className="flex flex-col p-2">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Phone className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{tPortal("phone")}</p>
                <p className="text-sm font-medium text-foreground text-end">
                  {patient?.phone ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Mail className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t("email")}</p>
                <p
                  className={cn(
                    "text-sm font-medium text-end break-all",
                    !patient?.email ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {patient?.email ?? t("fieldNotProvided")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Users className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t("clientType")}</p>
                <p className="text-sm font-medium text-foreground text-end">
                  {patient
                    ? t(`clientTypes.${patient.clientType}` as Parameters<typeof t>[0])
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Globe className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{tPortal("country")}</p>
                <p className="text-sm font-medium text-foreground text-end">
                  {patient?.country ?? "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0">
              <Stethoscope className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t("treatment")}</p>
                <p className="text-sm font-medium text-foreground text-end">{lead.treatmentSlug}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
