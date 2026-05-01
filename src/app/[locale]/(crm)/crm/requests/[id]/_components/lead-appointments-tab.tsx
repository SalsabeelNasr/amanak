"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crm } from "@/lib/crm/client";
import { CRM_TASK_ASSIGNEE_IDS } from "@/lib/crm/client.types";
import { useSession } from "@/lib/mock-session";
import { cn } from "@/lib/utils";
import type { Lead, LeadAppointment, LeadAppointmentKind } from "@/types";
import type { ConsultationSlot } from "@/types";
import { CalendarDays, Clock, Globe, Link2, ListTodo, MapPin, Phone, Stethoscope, Video } from "lucide-react";
import { InfiniteCardList } from "@/components/crm/infinite-card-list";
import { formatDateTime } from "@/components/crm/date-format";
import { EmptyState } from "@/components/crm/empty-state";

export type LeadAppointmentsTabFilter = "all" | LeadAppointmentKind;

export type LeadAppointmentsTabRef = {
  openAddModal: () => void;
};

function dateToLocalKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

type Props = {
  lead: Lead;
  consultationSlots: ConsultationSlot[];
  onLeadUpdated: (lead: Lead) => void;
  onOpenTasksTab: () => void;
  filter: LeadAppointmentsTabFilter;
  hideHeaderAdd?: boolean;
};

export const LeadAppointmentsTab = forwardRef<LeadAppointmentsTabRef, Props>(
  function LeadAppointmentsTab(
    {
      lead,
      consultationSlots,
      onLeadUpdated,
      onOpenTasksTab,
      filter,
      hideHeaderAdd = false,
    },
    ref,
  ) {
  const t = useTranslations("crm");
  const tBook = useTranslations("consultationBooking");
  const locale = useLocale();
  const { session } = useSession();
  const localeTag = locale === "ar" ? "ar-EG" : "en-US";
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [modalKind, setModalKind] = useState<LeadAppointmentKind>("team_consultation");
  const [treatmentLocation, setTreatmentLocation] = useState("");
  const [treatmentWhen, setTreatmentWhen] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [onlineTitle, setOnlineTitle] = useState("");
  const [onlineWhen, setOnlineWhen] = useState("");
  const [notes, setNotes] = useState("");
  const [consultSlotId, setConsultSlotId] = useState("");
  const [consultAssignee, setConsultAssignee] = useState("");

  const [clientTimeZone, setClientTimeZone] = useState<string | null>(null);

  const resetModal = useCallback(() => {
    setModalKind("team_consultation");
    setTreatmentLocation("");
    setTreatmentWhen("");
    setOnlineUrl("");
    setOnlineTitle("");
    setOnlineWhen("");
    setNotes("");
    setConsultSlotId("");
    setConsultAssignee(lead.ownerId ?? lead.assignedConsultantId ?? "");
    setFormError(null);
  }, [lead.ownerId, lead.assignedConsultantId]);

  const openModal = useCallback(() => {
    resetModal();
    const sortedDayKeys = [
      ...new Set(
        consultationSlots.map((s) => dateToLocalKey(new Date(s.startsAt))),
      ),
    ].sort();
    if (sortedDayKeys.length > 0) {
      const [y, m, d] = sortedDayKeys[0].split("-").map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    } else {
      setSelectedDate(undefined);
    }
    setModalOpen(true);
  }, [resetModal, consultationSlots]);

  useImperativeHandle(ref, () => ({ openAddModal: openModal }), [openModal]);

  const formatSlotTime = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(localeTag, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(iso)),
    [localeTag],
  );

  const formatSelectedHeading = useCallback(
    (date: Date) =>
      new Intl.DateTimeFormat(localeTag, {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(date),
    [localeTag],
  );

  const { daysWithSlots, slotsByDay } = useMemo(() => {
    const byDay = new Map<string, ConsultationSlot[]>();
    const days = new Set<string>();
    for (const s of consultationSlots) {
      const key = dateToLocalKey(new Date(s.startsAt));
      days.add(key);
      const list = byDay.get(key) ?? [];
      list.push(s);
      byDay.set(key, list);
    }
    for (const list of byDay.values()) {
      list.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    }
    return { daysWithSlots: days, slotsByDay: byDay };
  }, [consultationSlots]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 45);
    return d;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (modalKind !== "team_consultation" || selectedDate !== undefined) return;
    const sortedKeys = [
      ...new Set(
        consultationSlots.map((s) => dateToLocalKey(new Date(s.startsAt))),
      ),
    ].sort();
    if (sortedKeys.length === 0) return;
    const [y, m, d] = sortedKeys[0].split("-").map(Number);
    setSelectedDate(new Date(y, m - 1, d));
  }, [modalKind, selectedDate, consultationSlots]);

  const selectedKey = selectedDate ? dateToLocalKey(selectedDate) : "";
  const slotsForDay = selectedKey ? (slotsByDay.get(selectedKey) ?? []) : [];

  useEffect(() => {
    if (modalOpen) {
      setClientTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [modalOpen]);

  const filteredAppointments = useMemo(() => {
    const list =
      filter === "all"
        ? lead.appointments
        : lead.appointments.filter((a) => a.kind === filter);
    return [...list].sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }, [lead.appointments, filter]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session.isAuthenticated) return;
    setFormError(null);
    setSaving(true);
    try {
      if (modalKind === "treatment") {
        if (!treatmentLocation.trim() || !treatmentWhen) {
          setFormError(t("apptErrorRequiredFields"));
          setSaving(false);
          return;
        }
        const startMs = Date.parse(treatmentWhen);
        if (Number.isNaN(startMs)) {
          setFormError(t("apptErrorInvalidTime"));
          setSaving(false);
          return;
        }
        const updated = await crm.requests.addAppointment(
          lead.id,
          {
            kind: "treatment",
            startsAt: new Date(startMs).toISOString(),
            locationLabel: treatmentLocation.trim(),
            notes: notes.trim() || undefined,
            createdByUserId: session.user.id,
          },
          {},
        );
        onLeadUpdated(updated);
      } else if (modalKind === "online_meeting") {
        if (!onlineUrl.trim() || !onlineWhen) {
          setFormError(t("apptErrorRequiredFields"));
          setSaving(false);
          return;
        }
        const startMs = Date.parse(onlineWhen);
        if (Number.isNaN(startMs)) {
          setFormError(t("apptErrorInvalidTime"));
          setSaving(false);
          return;
        }
        const updated = await crm.requests.addAppointment(
          lead.id,
          {
            kind: "online_meeting",
            startsAt: new Date(startMs).toISOString(),
            meetingUrl: onlineUrl.trim(),
            title: onlineTitle.trim() || undefined,
            notes: notes.trim() || undefined,
            createdByUserId: session.user.id,
          },
          {},
        );
        onLeadUpdated(updated);
      } else {
        if (!consultSlotId) {
          setFormError(tBook("errors.slotRequired"));
          setSaving(false);
          return;
        }
        const slot = consultationSlots.find((s) => s.id === consultSlotId);
        if (!slot) {
          setFormError(tBook("errors.slotRequired"));
          setSaving(false);
          return;
        }
        const taskTitle = t("apptConsultationTaskTitle", {
          datetime: formatDateTime(slot.startsAt, locale),
        });
        const updated = await crm.requests.addAppointment(
          lead.id,
          {
            kind: "team_consultation",
            slotId: consultSlotId,
            taskTitle,
            notes: notes.trim() || undefined,
            assigneeId: consultAssignee.trim() || undefined,
            createdByUserId: session.user.id,
          },
          {},
        );
        onLeadUpdated(updated);
      }
      setModalOpen(false);
      resetModal();
    } catch (err) {
      console.error(err);
      setFormError(t("apptErrorGeneric"));
    } finally {
      setSaving(false);
    }
  }

  function kindIcon(k: LeadAppointment["kind"]) {
    switch (k) {
      case "treatment":
        return Stethoscope;
      case "online_meeting":
        return Video;
      default:
        return Phone;
    }
  }

  const listBody = (
    <InfiniteCardList
      key={filter}
      items={filteredAppointments}
      getItemKey={(appt) => appt.id}
      initialVisible={8}
      pageSize={8}
      empty={
        <EmptyState
          icon={CalendarDays}
          title={filter === "all" ? t("apptEmptyAll") : t("apptEmptyKind")}
          className="py-6 border-0"
        />
      }
      renderItem={(appt) => {
        const Icon = kindIcon(appt.kind);
        return (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-black/5 transition-all hover:bg-muted/5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {formatDateTime(appt.startsAt, locale)}
                </p>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {appt.kind === "treatment"
                    ? t("apptKindLabelTreatment")
                    : appt.kind === "online_meeting"
                      ? t("apptKindLabelOnline")
                      : t("apptKindLabelConsultation")}
                </p>
                {appt.kind === "treatment" ? (
                  <p className="flex items-start gap-1.5 text-sm text-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 opacity-70" />
                    {appt.locationLabel}
                  </p>
                ) : null}
                {appt.kind === "online_meeting" ? (
                  <div className="space-y-1 text-sm">
                    {appt.title ? (
                      <p className="font-medium text-foreground">{appt.title}</p>
                    ) : null}
                    <a
                      href={appt.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                    >
                      <Link2 className="size-3.5 shrink-0" />
                      {t("apptOpenMeetingLink")}
                    </a>
                  </div>
                ) : null}
                {appt.kind === "team_consultation" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-lg text-xs font-semibold"
                      onClick={() => onOpenTasksTab()}
                    >
                      <ListTodo className="size-3.5" />
                      {t("apptViewLinkedTask")}
                    </Button>
                  </div>
                ) : null}
                {appt.notes ? (
                  <p className="text-xs text-muted-foreground">{appt.notes}</p>
                ) : null}
              </div>
            </div>
          </div>
        );
      }}
    />
  );

  return (
    <div className="space-y-6">
      {hideHeaderAdd ? (
        listBody
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
          <div className="flex flex-col gap-4 border-b border-border bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="size-4" aria-hidden />
              </div>
              <h2 className="amanak-app-panel-title">{t("appointmentsSectionTitle")}</h2>
            </div>
            {session.isAuthenticated ? (
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-xl text-sm font-semibold shadow-md"
                onClick={openModal}
              >
                {t("apptAdd")}
              </Button>
            ) : null}
          </div>

          <div className="space-y-4 p-6">{listBody}</div>
        </section>
      )}

      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) resetModal();
        }}
      >
        <DialogContent
          dir={locale === "ar" ? "rtl" : "ltr"}
          size="xl"
          layout="scrollableTall"
        >
          <DialogHeader>
            <DialogTitle>{t("apptModalTitle")}</DialogTitle>
            <DialogDescription>{t("apptModalDescription")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden"
          >
            <DialogBody className="space-y-5">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["treatment", "apptKindTreatment", Stethoscope],
                  ["online_meeting", "apptKindOnline", Video],
                  ["team_consultation", "apptKindConsultation", Phone],
                ] as const
              ).map(([kind, labelKey, Icon]) => (
                <Button
                  key={kind}
                  type="button"
                  variant={modalKind === kind ? "default" : "outline"}
                  className="h-auto flex-row items-center justify-center gap-2 px-2 py-2.5 text-xs font-semibold"
                  onClick={() => {
                    setModalKind(kind);
                    setFormError(null);
                  }}
                >
                  <Icon className="size-4" />
                  {t(labelKey)}
                </Button>
              ))}
            </div>

            {modalKind === "treatment" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="appt-loc">{t("apptLocationLabel")}</Label>
                  <Input
                    id="appt-loc"
                    value={treatmentLocation}
                    onChange={(e) => setTreatmentLocation(e.target.value)}
                    className="rounded-xl"
                    placeholder={t("apptLocationPlaceholder")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="appt-twhen">{t("apptDateTime")}</Label>
                  <Input
                    id="appt-twhen"
                    type="datetime-local"
                    value={treatmentWhen}
                    onChange={(e) => setTreatmentWhen(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            ) : null}

            {modalKind === "online_meeting" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="appt-url">{t("apptMeetingUrl")}</Label>
                  <Input
                    id="appt-url"
                    type="url"
                    value={onlineUrl}
                    onChange={(e) => setOnlineUrl(e.target.value)}
                    className="rounded-xl"
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="appt-otitle">{t("apptMeetingTitleOptional")}</Label>
                  <Input
                    id="appt-otitle"
                    value={onlineTitle}
                    onChange={(e) => setOnlineTitle(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="appt-owhen">{t("apptDateTime")}</Label>
                  <Input
                    id="appt-owhen"
                    type="datetime-local"
                    value={onlineWhen}
                    onChange={(e) => setOnlineWhen(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            ) : null}

            {modalKind === "team_consultation" ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">{t("apptCreatesTaskHint")}</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start sm:gap-6">
                  <div className="min-w-0 space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {tBook("selectDateTime")}
                    </h3>
                    <div dir="ltr" className="w-full">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => {
                          setSelectedDate(d);
                          setConsultSlotId("");
                        }}
                        defaultMonth={selectedDate ?? today}
                        startMonth={today}
                        endMonth={maxDate}
                        disabled={(date) => {
                          const t0 = startOfLocalDay(date);
                          if (
                            t0 < startOfLocalDay(today) ||
                            t0 > startOfLocalDay(maxDate)
                          ) {
                            return true;
                          }
                          return !daysWithSlots.has(dateToLocalKey(date));
                        }}
                        className="w-full bg-transparent p-0 shadow-none"
                        classNames={{
                          root: "w-full",
                          months: "w-full max-w-full sm:flex-col",
                          month: "w-full min-w-0 gap-2",
                          month_caption: "mb-0 h-8 px-7",
                          caption_label:
                            "text-xs font-semibold text-foreground",
                          nav: "inset-x-0 top-0",
                          button_previous: cn(
                            buttonVariants({ variant: "outline", size: "icon" }),
                            "size-7 shrink-0 rounded-full border-border bg-background p-0 shadow-none",
                          ),
                          button_next: cn(
                            buttonVariants({ variant: "outline", size: "icon" }),
                            "size-7 shrink-0 rounded-full border-primary/25 bg-primary/5 p-0 text-primary shadow-none hover:bg-primary/10",
                          ),
                          month_grid: "w-full table-fixed",
                          weekdays: "flex w-full gap-1",
                          weekday:
                            "min-w-0 flex-1 text-[0.65rem] font-medium text-muted-foreground",
                          week: "mt-1 flex w-full gap-1",
                          day: "flex min-w-0 flex-1 justify-center p-0 text-center text-xs",
                          day_button: cn(
                            buttonVariants({ variant: "ghost" }),
                            "size-8 shrink-0 rounded-full p-0 text-xs font-normal aria-selected:opacity-100",
                          ),
                          selected:
                            "[&_button]:rounded-full [&_button]:bg-primary [&_button]:font-medium [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground",
                          today: "font-medium text-primary",
                        }}
                      />
                    </div>
                  </div>
                  <div className="min-w-0 space-y-2 border-t border-border pt-3 sm:border-t-0 sm:border-s sm:pt-0 sm:ps-6">
                    <h3 className="text-sm font-semibold text-foreground">
                      {selectedDate
                        ? formatSelectedHeading(selectedDate)
                        : tBook("slotsHeading")}
                    </h3>
                    {slotsForDay.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {tBook("noSlotsDay")}
                      </p>
                    ) : (
                      <div
                        className="flex max-h-[min(48vh,320px)] flex-col gap-1.5 overflow-y-auto pe-1"
                        role="listbox"
                      >
                        {slotsForDay.map((s) => {
                          const active = consultSlotId === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              role="option"
                              aria-selected={active}
                              className={cn(
                                buttonVariants({
                                  variant: active ? "default" : "outline",
                                  size: "sm",
                                }),
                                "h-9 w-full shrink-0 justify-center rounded-md text-sm font-medium shadow-none",
                              )}
                              onClick={() => setConsultSlotId(s.id)}
                            >
                              {formatSlotTime(s.startsAt)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs">
                  <Globe className="size-3.5 shrink-0 text-primary opacity-90" />
                  <span className="font-medium text-foreground">
                    {tBook("timeZoneLabel")}
                  </span>
                  <span className="min-w-0 break-all text-muted-foreground">
                    {clientTimeZone ?? "…"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="appt-assignee">{t("apptAssignee")}</Label>
                  <select
                    id="appt-assignee"
                    value={consultAssignee}
                    onChange={(e) => setConsultAssignee(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
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
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="appt-notes">{t("apptNotesOptional")}</Label>
              <textarea
                id="appt-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>

            {formError ? (
              <p className="text-xs font-medium text-destructive" role="alert">
                {formError}
              </p>
            ) : null}

            </DialogBody>

            <DialogFooter className="mt-4 gap-2 border-t border-border pt-4 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => setModalOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-semibold"
                disabled={saving || !session.isAuthenticated}
              >
                {t("apptSave")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
});

LeadAppointmentsTab.displayName = "LeadAppointmentsTab";
