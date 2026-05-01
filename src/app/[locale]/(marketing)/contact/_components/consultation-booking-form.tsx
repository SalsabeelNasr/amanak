"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Globe, Phone, Calendar as CalendarIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { bookConsultationAction } from "@/app/[locale]/(marketing)/contact/consultation-booking-actions";
import { Calendar } from "@/components/ui/calendar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  consultationBookingFormSchema,
  type ConsultationBookingFormValues,
} from "@/lib/consultation-booking-schema";
import { cn } from "@/lib/utils";
import type { ConsultantProfile, ConsultationSlot } from "@/types";

function dateToLocalKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function errorMessage(
  tErr: (key: string) => string,
  code: string | undefined,
): string | undefined {
  if (!code) return undefined;
  const map: Record<string, string> = {
    minName: tErr("errors.minName"),
    minPhone: tErr("errors.minPhone"),
    emailInvalid: tErr("errors.emailInvalid"),
    emailRequired: tErr("errors.emailRequired"),
    slotRequired: tErr("errors.slotRequired"),
    required: tErr("errors.required"),
  };
  return map[code] ?? code;
}

type Props = {
  initialSlots: ConsultationSlot[];
  consultant: ConsultantProfile;
  /** Called after a booking is confirmed (mock / real). */
  onBookingConfirmed?: (bookingId: string) => void;
  compact?: boolean;
};

/** Temporarily disable consultation booking submissions */
const CONSULTATION_BOOKING_SUBMIT_DISABLED = true;

export function ConsultationBookingForm({
  initialSlots,
  consultant,
  onBookingConfirmed,
  compact = false,
}: Props) {
  const t = useTranslations("consultationBooking");
  const locale = useLocale();
  const [slots, setSlots] = useState(initialSlots);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [contactStep, setContactStep] = useState<"slot" | "details">("slot");
  const [clientTimeZone, setClientTimeZone] = useState<string | null>(null);
  const prevSlotId = useRef<string | undefined>(undefined);

  const localeTag = locale === "ar" ? "ar-EG" : "en-US";

  useEffect(() => {
    setClientTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

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
    for (const s of slots) {
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
  }, [slots]);

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

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const sortedKeys = [...daysWithSlots].sort();
    if (sortedKeys.length === 0) return undefined;
    const [y, m, d] = sortedKeys[0].split("-").map(Number);
    return new Date(y, m - 1, d);
  });

  const form = useForm<ConsultationBookingFormValues>({
    resolver: zodResolver(consultationBookingFormSchema),
    defaultValues: {
      slotId: "",
      fullName: "",
      phone: "",
      email: "",
    },
  });

  const slotId = form.watch("slotId");

  useEffect(() => {
    if (prevSlotId.current === slotId) return;
    prevSlotId.current = slotId;
    setContactStep("slot");
  }, [slotId]);

  const selectedKey = selectedDate ? dateToLocalKey(selectedDate) : "";
  const slotsForDay = selectedKey ? (slotsByDay.get(selectedKey) ?? []) : [];

  const detailsRef = useRef<HTMLDivElement>(null);

  const openDetails = useCallback(() => {
    setContactStep("details");
    requestAnimationFrame(() => {
      detailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, []);

  const onSubmit = form.handleSubmit(async (values) => {
    setBookingId(null);
    form.clearErrors("root");
    const res = await bookConsultationAction(values);
    if (res.ok) {
      setBookingId(res.id);
      onBookingConfirmed?.(res.id);
      setSlots((prev) => prev.filter((s) => s.id !== values.slotId));
      form.reset({
        slotId: "",
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
      });
      setContactStep("slot");
      return;
    }
    if (res.error === "slot_unavailable") {
      form.setError("root", { message: "slotUnavailable" });
      return;
    }
    const fe = res.fieldErrors;
    if (fe?.fullName?.[0])
      form.setError("fullName", { message: fe.fullName[0] });
    if (fe?.phone?.[0]) form.setError("phone", { message: fe.phone[0] });
    if (fe?.email?.[0]) form.setError("email", { message: fe.email[0] });
    if (fe?.slotId?.[0]) form.setError("slotId", { message: fe.slotId[0] });
  });

  const initials = t("consultant.initials");
  const isBookableDay = useCallback(
    (date: Date) => {
      const t0 = startOfLocalDay(date);
      if (t0 < startOfLocalDay(today) || t0 > startOfLocalDay(maxDate)) {
        return false;
      }
      return daysWithSlots.has(dateToLocalKey(date));
    },
    [today, maxDate, daysWithSlots],
  );

  return (
    <div className={compact ? "py-0" : "py-8 sm:py-12 lg:py-16"}>
      <div className={compact ? "w-full" : "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"}>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Event / host column */}
            <aside className="border-border p-6 sm:p-8 lg:col-span-3 lg:border-e lg:bg-secondary/25">
              <div className="space-y-8 text-start">
                <div className="flex flex-col items-start gap-4">
                  {consultant.imageSrc ? (
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-full ring-4 ring-primary/10">
                      <Image
                        src={consultant.imageSrc}
                        alt={t(consultant.nameKey as "consultant.name")}
                        width={64}
                        height={64}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-4 ring-primary/10"
                      aria-hidden
                    >
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t("consultant.subheading")}
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {t(consultant.nameKey as "consultant.name")}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {t("title")}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("lead")}
                  </p>
                </div>

                <ul className="flex flex-col gap-3 text-sm font-medium text-foreground">
                  <li className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Clock className="size-4 shrink-0" aria-hidden />
                    </div>
                    <span>{t("duration")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="size-4 shrink-0" aria-hidden />
                    </div>
                    <span>{t("meetingFormat")}</span>
                  </li>
                </ul>
              </div>
            </aside>

            {/* Calendar column */}
            <div className="border-border p-6 sm:p-8 lg:col-span-5 lg:border-e">
              <h2 className="mb-6 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {t("selectDateTime")}
              </h2>

              <div dir="ltr" className="w-full min-w-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    setSelectedDate(d);
                    form.setValue("slotId", "");
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
                  modifiers={{
                    bookable: (date) => {
                      if (!isBookableDay(date)) return false;
                      if (!selectedDate) return true;
                      return (
                        dateToLocalKey(date) !== dateToLocalKey(selectedDate)
                      );
                    },
                  }}
                  modifiersClassNames={{
                    bookable:
                      "[&_button]:bg-primary/10 [&_button]:font-medium [&_button]:text-primary [&_button]:hover:bg-primary/15 [&_button]:hover:text-primary",
                  }}
                  className="bg-transparent p-0 shadow-none"
                  classNames={{
                    root: "w-full min-w-0",
                    months: "w-full",
                    month: "w-full gap-4",
                    month_caption: "mb-2 h-10 px-9 sm:h-12 sm:px-10",
                    caption_label:
                      "text-base font-bold text-foreground sm:text-lg",
                    button_previous: cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "size-10 shrink-0 rounded-full border-border bg-background shadow-sm sm:size-11",
                    ),
                    button_next: cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "size-10 shrink-0 rounded-full border-primary/25 bg-primary/5 text-primary shadow-sm hover:bg-primary/10 sm:size-11",
                    ),
                    weekdays: "w-full gap-1",
                    weekday:
                      "flex-1 text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground sm:text-[0.75rem]",
                    week: "mt-3 flex w-full gap-1 sm:mt-4 sm:gap-2",
                    day: "flex-1 p-0 text-center text-sm",
                    day_button: cn(
                      buttonVariants({ variant: "ghost" }),
                      "mx-auto size-10 rounded-full p-0 text-sm font-medium aria-selected:opacity-100 sm:size-11",
                    ),
                    selected:
                      "[&_button]:rounded-full [&_button]:bg-primary [&_button]:font-bold [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground [&_button]:focus:bg-primary [&_button]:focus:text-primary-foreground [&_button]:shadow-lg [&_button]:shadow-primary/20",
                    today: "font-bold text-primary",
                  }}
                />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-6 text-sm">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="size-4 shrink-0" aria-hidden />
                </div>
                <div>
                  <span className="font-bold text-foreground">
                    {t("timeZoneLabel")}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {clientTimeZone ?? "…"} • {t("localTimeNote")}
                  </p>
                </div>
              </div>
            </div>

            {/* Times & booking */}
            <div className="p-6 sm:p-8 lg:col-span-4">
              <h2 className="mb-6 text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {selectedDate
                  ? formatSelectedHeading(selectedDate)
                  : t("slotsHeading")}
              </h2>

              {slotsForDay.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-muted/30 py-12 text-center">
                  <CalendarIcon className="mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("noSlotsDay")}
                  </p>
                </div>
              ) : (
                <Controller
                  name="slotId"
                  control={form.control}
                  render={({ field }) => (
                    <div
                      className="flex flex-col gap-2.5"
                      role="listbox"
                      aria-label={t("slotsHeading")}
                    >
                      {slotsForDay.map((s) => {
                        const active = field.value === s.id;
                        const label = formatSlotTime(s.startsAt);
                        if (!active) {
                          return (
                            <button
                              key={s.id}
                              type="button"
                              role="option"
                              aria-selected={false}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "lg" }),
                                "h-12 w-full justify-center rounded-2xl border-primary/20 bg-background text-sm font-bold text-primary shadow-sm hover:border-primary hover:bg-primary hover:text-white transition-all",
                              )}
                              onClick={() => {
                                field.onChange(s.id);
                                form.clearErrors("slotId");
                              }}
                            >
                              {label}
                            </button>
                          );
                        }
                        return (
                          <div
                            key={s.id}
                            className="flex w-full overflow-hidden rounded-2xl border-2 border-primary shadow-md animate-in fade-in zoom-in-95 duration-200"
                            role="option"
                            aria-selected
                          >
                            <span className="flex min-h-12 flex-1 items-center justify-center bg-muted/50 px-3 text-sm font-bold text-foreground">
                              {label}
                            </span>
                            <button
                              type="button"
                              className={cn(
                                buttonVariants({ variant: "default", size: "lg" }),
                                "h-12 shrink-0 rounded-none px-6 text-sm font-bold shadow-none",
                              )}
                              onClick={openDetails}
                            >
                              {t("slotConfirm")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                />
              )}

              {form.formState.errors.slotId?.message && (
                <p className="mt-4 text-xs font-medium text-destructive sm:text-sm" role="alert">
                  {errorMessage(t, form.formState.errors.slotId.message)}
                </p>
              )}

              <div
                ref={detailsRef}
                className={cn(
                  "mt-8 space-y-4 border-t border-border pt-8 text-start transition-all duration-300",
                  contactStep === "details"
                    ? "opacity-100 translate-y-0"
                    : "pointer-events-none opacity-20 translate-y-4",
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t("detailsHeading")}
                  </h3>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cb-fullName" className="font-semibold">{t("fields.fullName")}</Label>
                    <Input
                      id="cb-fullName"
                      autoComplete="name"
                      className="h-11 rounded-xl border-2 focus-visible:ring-primary"
                      disabled={contactStep !== "details"}
                      {...form.register("fullName")}
                      aria-invalid={!!form.formState.errors.fullName}
                    />
                    {form.formState.errors.fullName?.message && (
                      <p className="text-xs font-medium text-destructive" role="alert">
                        {errorMessage(
                          t,
                          form.formState.errors.fullName.message,
                        )}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cb-email" className="font-semibold">{t("fields.email")}</Label>
                    <Input
                      id="cb-email"
                      type="email"
                      autoComplete="email"
                      className="h-11 rounded-xl border-2 focus-visible:ring-primary"
                      disabled={contactStep !== "details"}
                      {...form.register("email")}
                      aria-invalid={!!form.formState.errors.email}
                    />
                    {form.formState.errors.email?.message && (
                      <p className="text-xs font-medium text-destructive" role="alert">
                        {errorMessage(t, form.formState.errors.email.message)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cb-phone" className="font-semibold">{t("fields.phone")}</Label>
                    <Input
                      id="cb-phone"
                      type="tel"
                      autoComplete="tel"
                      dir="ltr"
                      className="h-11 rounded-xl border-2 focus-visible:ring-primary"
                      disabled={contactStep !== "details"}
                      {...form.register("phone")}
                      aria-invalid={!!form.formState.errors.phone}
                    />
                    {form.formState.errors.phone?.message && (
                      <p className="text-xs font-medium text-destructive" role="alert">
                        {errorMessage(t, form.formState.errors.phone.message)}
                      </p>
                    )}
                  </div>

                  {form.formState.errors.root?.message === "slotUnavailable" && (
                    <p className="text-xs font-medium text-destructive" role="alert">
                      {t("errors.slotUnavailable")}
                    </p>
                  )}

                  {bookingId && (
                    <div className="rounded-xl bg-primary/10 p-4 text-sm font-bold text-primary animate-in fade-in slide-in-from-top-2" role="status">
                      {t("success", { id: bookingId })}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full rounded-full text-sm font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl"
                    disabled={
                      form.formState.isSubmitting ||
                      contactStep !== "details" ||
                      CONSULTATION_BOOKING_SUBMIT_DISABLED
                    }
                    data-testid="consultation-book-submit"
                  >
                    {form.formState.isSubmitting ? "Booking..." : t("submit")}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
