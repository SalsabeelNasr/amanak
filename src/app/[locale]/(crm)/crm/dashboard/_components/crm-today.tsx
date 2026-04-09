"use client";

import { useTranslations, useLocale } from "next-intl";
import { Calendar, ListTodo, Clock, User, ChevronRight, Filter, Activity } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import type {
  CrmTodayAppointmentItem,
  CrmTodayDigest,
  CrmTodayMemberBucket,
  CrmTodayTaskItem,
} from "@/lib/crm-today-digest";

function formatTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDueDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
  });
}

type TimelineRow =
  | { variant: "appointment"; sortAt: number; data: CrmTodayAppointmentItem }
  | { variant: "task"; sortAt: number; data: CrmTodayTaskItem };

function buildTimelineRows(bucket: CrmTodayMemberBucket): TimelineRow[] {
  const rows: TimelineRow[] = [
    ...bucket.appointments.map((data) => ({
      variant: "appointment" as const,
      sortAt: new Date(data.startsAt).getTime(),
      data,
    })),
    ...bucket.tasks.map((data) => ({
      variant: "task" as const,
      sortAt: new Date(data.dueAt).getTime(),
      data,
    })),
  ];
  rows.sort((a, b) => a.sortAt - b.sortAt);
  return rows;
}

export function CrmToday({ 
  digest, 
  currentUserId 
}: { 
  digest: CrmTodayDigest;
  currentUserId: string;
}) {
  const t = useTranslations("crm");
  const locale = useLocale();
  const [filterId, setFilterId] = useState<string>(currentUserId);

  const activeBucket = useMemo(() => {
    return digest.buckets.find(b => b.memberId === filterId) || null;
  }, [digest.buckets, filterId]);

  const timeline = useMemo(() => {
    return activeBucket ? buildTimelineRows(activeBucket) : [];
  }, [activeBucket]);

  function appointmentKindLabel(
    kind: "treatment" | "online_meeting" | "team_consultation",
  ): string {
    switch (kind) {
      case "treatment":
        return t("apptKindLabelTreatment");
      case "online_meeting":
        return t("apptKindLabelOnline");
      default:
        return t("apptKindLabelConsultation");
    }
  }

  function memberSectionTitle(memberId: string): string {
    if (memberId === "__unassigned__") return t("taskAssigneeNone");
    return t(`taskAssignees.${memberId}` as Parameters<typeof t>[0]);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <header className="flex flex-col gap-4 border-b border-border/40 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="amanak-app-page-title">{t("dashboard")}</h1>
          <p className="text-sm text-muted-foreground">{t("crmTodayHint")}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
              className="h-9 w-full rounded-lg border border-border/50 bg-card ps-9 pe-3 text-xs font-medium shadow-sm ring-offset-background transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring sm:w-48"
            >
              {digest.buckets.map((b) => (
                <option key={b.memberId} value={b.memberId}>
                  {memberSectionTitle(b.memberId)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
        <div className="flex gap-3 border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="size-4" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="amanak-app-panel-title">
              {memberSectionTitle(filterId)}
            </h2>
            <p className="text-[10px] font-medium leading-snug text-muted-foreground/80">
              {timeline.length} {t("crmTodayTasks")} & {t("crmTodayAppointments")}
            </p>
          </div>
        </div>

        <div className="p-6">
          {!activeBucket || timeline.length === 0 ? (
            <p className="py-12 text-center text-xs font-medium text-muted-foreground">
              {t("crmTodayGlobalEmpty")}
            </p>
          ) : (
            <div className="relative space-y-8 before:absolute before:inset-0 before:start-[11px] before:w-px before:bg-border/60">
              {timeline.map((entry, idx) => {
                const isAppointment = entry.variant === "appointment";
                const row = entry.data;

                return (
                  <div key={idx} className="group relative ps-10">
                    {/* Activity Dot */}
                    <div className={cn(
                      "absolute start-0 top-1.5 z-10 flex size-[24px] items-center justify-center rounded-full border-2 bg-background transition-all group-hover:scale-110",
                      isAppointment ? "border-primary/20" : "border-muted-foreground/20"
                    )}>
                      <div className={cn(
                        "size-2 rounded-full transition-colors",
                        isAppointment ? "bg-primary/40 group-hover:bg-primary" : "bg-muted-foreground/40 group-hover:bg-muted-foreground"
                      )} />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <Link
                          href={`/crm/leads/${row.leadId}`}
                          className="text-sm font-bold text-foreground transition-colors hover:text-primary"
                        >
                          {row.patientName}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="amanak-app-meta text-muted-foreground/80 tabular-nums">
                            {isAppointment ? formatTime((row as CrmTodayAppointmentItem).startsAt, locale) : formatDueDate((row as CrmTodayTaskItem).dueAt, locale)}
                          </span>
                          {isAppointment ? (
                            <Badge variant="outline" className="h-4 border-primary/20 bg-primary/5 px-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                              {appointmentKindLabel((row as CrmTodayAppointmentItem).kind)}
                            </Badge>
                          ) : (row as CrmTodayTaskItem).overdue && (
                            <Badge variant="destructive" className="h-4 px-1 text-[9px] font-bold uppercase tracking-wider">
                              {t("crmTodayOverdue")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/40 bg-muted/30 p-4 shadow-sm transition-colors group-hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {isAppointment ? (
                                <Calendar className="size-3 text-primary/60" />
                              ) : (
                                <ListTodo className="size-3 text-muted-foreground/60" />
                              )}
                              <p className="text-[13px] font-medium leading-relaxed text-foreground/80">
                                {isAppointment ? (row as CrmTodayAppointmentItem).label || appointmentKindLabel((row as CrmTodayAppointmentItem).kind) : (row as CrmTodayTaskItem).title}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="mt-0.5 size-4 text-muted-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
