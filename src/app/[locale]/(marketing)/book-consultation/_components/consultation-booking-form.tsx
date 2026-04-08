"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Globe, Phone } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { bookConsultationAction } from "@/app/[locale]/(marketing)/book-consultation/actions";
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
};

export function ConsultationBookingForm({ initialSlots, consultant }: Props) {
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
    <div className="bg-muted/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="grid xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,16.5rem)]">
            {/* Event / host column */}
            <aside className="border-border p-6 sm:p-7 xl:border-e xl:bg-secondary/25">
              <div className="space-y-6 text-start">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                  {consultant.imageSrc ? (
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/15">
                      <Image
                        src={consultant.imageSrc}
                        alt={t(consultant.nameKey as "consultant.name")}
                        width={56}
                        height={56}
                        className="size-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary ring-2 ring-primary/15"
                      aria-hidden
                    >
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("consultant.subheading")}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {t(consultant.nameKey as "consultant.name")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {t("title")}
                  </h1>
                  <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                    {t("lead")}
                  </p>
                </div>

                <ul className="flex flex-col gap-2 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <Clock
                      className="size-4 shrink-0 text-primary opacity-90"
                      aria-hidden
                    />
                    <span>{t("duration")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone
                      className="size-4 shrink-0 text-primary opacity-90"
                      aria-hidden
                    />
                    <span>{t("meetingFormat")}</span>
                  </li>
                </ul>
              </div>
            </aside>

            {/* Calendar column */}
            <div className="border-border p-6 sm:p-7 xl:border-e">
              <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground sm:text-lg">
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
                    month_caption: "mb-1 h-10 px-9 sm:h-11 sm:px-10",
                    caption_label:
                      "text-sm font-semibold text-foreground sm:text-base",
                    button_previous: cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "size-9 shrink-0 rounded-full border-border bg-background shadow-none sm:size-10",
                    ),
                    button_next: cn(
                      buttonVariants({ variant: "outline", size: "icon" }),
                      "size-9 shrink-0 rounded-full border-primary/25 bg-primary/5 text-primary shadow-none hover:bg-primary/10 sm:size-10",
                    ),
                    weekdays: "w-full gap-0.5",
                    weekday:
                      "flex-1 text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground sm:text-[0.7rem]",
                    week: "mt-2 flex w-full gap-0.5 sm:mt-2.5 sm:gap-1",
                    day: "flex-1 p-0 text-center text-sm",
                    day_button: cn(
                      buttonVariants({ variant: "ghost" }),
                      "mx-auto size-9 rounded-full p-0 text-sm font-normal aria-selected:opacity-100 sm:size-10",
                    ),
                    selected:
                      "[&_button]:rounded-full [&_button]:bg-primary [&_button]:font-medium [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground [&_button]:focus:bg-primary [&_button]:focus:text-primary-foreground",
                    today: "font-medium text-primary",
                  }}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-border pt-4 text-sm">
                <Globe
                  className="size-3.5 shrink-0 translate-y-0.5 text-primary opacity-90"
                  aria-hidden
                />
                <span className="font-medium text-foreground">
                  {t("timeZoneLabel")}
                </span>
                <span className="min-w-0 break-all text-muted-foreground">
                  {clientTimeZone ?? "…"}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                {t("localTimeNote")}
              </p>
            </div>

            {/* Times & booking */}
            <div className="p-6 sm:p-7">
              <h2 className="mb-4 text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {selectedDate
                  ? formatSelectedHeading(selectedDate)
                  : t("slotsHeading")}
              </h2>

              {slotsForDay.length === 0 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("noSlotsDay")}
                </p>
              ) : (
                <Controller
                  name="slotId"
                  control={form.control}
                  render={({ field }) => (
                    <div
                      className="flex flex-col gap-1.5"
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
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "h-10 w-full justify-center rounded-md border-primary/35 bg-background text-sm font-medium text-primary shadow-none hover:bg-primary/5",
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
                            className="flex w-full overflow-hidden rounded-md border border-primary shadow-none"
                            role="option"
                            aria-selected
                          >
                            <span className="flex min-h-10 flex-1 items-center justify-center bg-muted px-3 text-sm font-medium text-foreground">
                              {label}
                            </span>
                            <button
                              type="button"
                              className={cn(
                                buttonVariants({ variant: "default", size: "sm" }),
                                "h-10 shrink-0 rounded-none px-4 text-sm font-semibold shadow-none sm:min-w-[5.75rem]",
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
                <p className="mt-2 text-xs text-destructive sm:text-sm" role="alert">
                  {errorMessage(t, form.formState.errors.slotId.message)}
                </p>
              )}

              <div
                ref={detailsRef}
                className={cn(
                  "mt-6 space-y-3 border-t border-border pt-6 text-start transition-opacity duration-200",
                  contactStep === "details"
                    ? "opacity-100"
                    : "pointer-events-none opacity-40",
                )}
              >
                <h3 className="text-xs font-semibold text-muted-foreground sm:text-sm">
                  {t("detailsHeading")}
                </h3>

                <form onSubmit={onSubmit} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-fullName">{t("fields.fullName")}</Label>
                    <Input
                      id="cb-fullName"
                      autoComplete="name"
                      disabled={contactStep !== "details"}
                      {...form.register("fullName")}
                      aria-invalid={!!form.formState.errors.fullName}
                    />
                    {form.formState.errors.fullName?.message && (
                      <p className="text-xs text-destructive sm:text-sm" role="alert">
                        {errorMessage(
                          t,
                          form.formState.errors.fullName.message,
                        )}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-email">{t("fields.email")}</Label>
                    <Input
                      id="cb-email"
                      type="email"
                      autoComplete="email"
                      disabled={contactStep !== "details"}
                      {...form.register("email")}
                      aria-invalid={!!form.formState.errors.email}
                    />
                    {form.formState.errors.email?.message && (
                      <p className="text-xs text-destructive sm:text-sm" role="alert">
                        {errorMessage(t, form.formState.errors.email.message)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cb-phone">{t("fields.phone")}</Label>
                    <Input
                      id="cb-phone"
                      type="tel"
                      autoComplete="tel"
                      disabled={contactStep !== "details"}
                      {...form.register("phone")}
                      aria-invalid={!!form.formState.errors.phone}
                    />
                    {form.formState.errors.phone?.message && (
                      <p className="text-xs text-destructive sm:text-sm" role="alert">
                        {errorMessage(t, form.formState.errors.phone.message)}
                      </p>
                    )}
                  </div>

                  {form.formState.errors.root?.message === "slotUnavailable" && (
                    <p className="text-xs text-destructive sm:text-sm" role="alert">
                      {t("errors.slotUnavailable")}
                    </p>
                  )}

                  {bookingId && (
                    <p className="text-sm leading-snug text-primary" role="status">
                      {t("success", { id: bookingId })}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="default"
                    className="mt-1 h-10 w-full rounded-md px-6 text-sm font-semibold sm:w-auto"
                    disabled={
                      form.formState.isSubmitting || contactStep !== "details"
                    }
                    data-testid="consultation-book-submit"
                  >
                    {t("submit")}
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
