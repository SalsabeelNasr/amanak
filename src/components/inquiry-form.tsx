"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { submitInquiryAction } from "@/app/[locale]/inquiry/actions";
import type { InquiryFormValues } from "@/lib/inquiry-schema";
import { inquiryFormSchema } from "@/lib/inquiry-schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TreatmentOption = { slug: string; label: string };

function errorMessage(
  tErr: (key: string) => string,
  code: string | undefined,
): string | undefined {
  if (!code) return undefined;
  const map: Record<string, string> = {
    minName: tErr("errors.minName"),
    minPhone: tErr("errors.minPhone"),
    minMessage: tErr("errors.minMessage"),
    emailInvalid: tErr("errors.emailInvalid"),
    required: tErr("errors.required"),
    date: tErr("errors.date"),
  };
  return map[code] ?? code;
}

export function InquiryForm({ treatments }: { treatments: TreatmentOption[] }) {
  const t = useTranslations("inquiry");
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquiryFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      treatmentSlug: "",
      message: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmittedId(null);
    const payload = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || undefined,
      treatmentSlug: values.treatmentSlug?.trim() || undefined,
      message: values.message.trim(),
    };
    const res = await submitInquiryAction(payload);
    if (res.ok) setSubmittedId(res.id);
  });

  return (
    <Card className="border-border shadow-sm">
      <CardContent className="p-6 sm:p-8">
        {submittedId ? (
          <p className="text-center font-medium text-primary" role="status">
            {t("success")}
          </p>
        ) : (
          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="fullName">{t("fullName")}</Label>
              <Input
                id="fullName"
                autoComplete="name"
                aria-invalid={!!form.formState.errors.fullName}
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName ? (
                <p className="text-sm text-destructive">
                  {errorMessage(t, form.formState.errors.fullName.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={!!form.formState.errors.phone}
                {...form.register("phone")}
              />
              {form.formState.errors.phone ? (
                <p className="text-sm text-destructive">
                  {errorMessage(t, form.formState.errors.phone.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">
                  {errorMessage(t, form.formState.errors.email.message)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentSlug">{t("treatment")}</Label>
              <Controller
                name="treatmentSlug"
                control={form.control}
                render={({ field }) => (
                  <select
                    id="treatmentSlug"
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    {...field}
                  >
                    <option value="">{t("treatmentPlaceholder")}</option>
                    {treatments.map((opt) => (
                      <option key={opt.slug} value={opt.slug}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("message")}</Label>
              <textarea
                id="message"
                rows={4}
                className="flex min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-invalid={!!form.formState.errors.message}
                {...form.register("message")}
              />
              {form.formState.errors.message ? (
                <p className="text-sm text-destructive">
                  {errorMessage(t, form.formState.errors.message.message)}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              className="min-h-11 w-full sm:w-auto"
              disabled={form.formState.isSubmitting}
              data-testid="inquiry-submit"
            >
              {t("submit")}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
