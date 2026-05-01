"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { crm } from "@/lib/crm/client";
import { ROUTES } from "@/lib/routes";
import {
  createPatientFormSchema,
  type CreatePatientFormValues,
} from "@/lib/crm/schemas/patient";

export function NewPatientDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("crm.patientsPage");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreatePatientFormValues>({
    resolver: zodResolver(createPatientFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      country: "",
      age: "",
      clientType: "b2c",
      hasPortalAccess: false,
      notes: "",
    },
  });

  async function onSubmit(values: CreatePatientFormValues) {
    setSaving(true);
    setError(null);
    try {
      const ageNum =
        values.age?.trim() && !Number.isNaN(Number(values.age))
          ? Number.parseInt(values.age, 10)
          : undefined;
      const created = await crm.patients.create(
        {
          name: values.name,
          phone: values.phone,
          email: values.email?.trim() || undefined,
          country: values.country,
          age: ageNum,
          clientType: values.clientType,
          hasPortalAccess: values.hasPortalAccess,
          createdBy: "crm",
          notes: values.notes,
        },
        {},
      );
      onOpenChange(false);
      form.reset();
      router.push(`${ROUTES.crmPatients}/${created.id}`);
    } catch (e) {
      console.error(e);
      setError(t("createError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("newPatientTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="np-name">{t("fieldName")}</Label>
              <Input id="np-name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="np-phone">{t("fieldPhone")}</Label>
                <Input id="np-phone" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="np-country">{t("fieldCountry")}</Label>
                <Input id="np-country" {...form.register("country")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-email">{t("fieldEmail")}</Label>
              <Input id="np-email" type="email" {...form.register("email")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="np-age">{t("fieldAge")}</Label>
                <Input id="np-age" type="number" min={1} {...form.register("age")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="np-client">{t("fieldClientType")}</Label>
                <select
                  id="np-client"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register("clientType")}
                >
                  <option value="b2c">B2C</option>
                  <option value="b2b">B2B</option>
                  <option value="g2b">G2B</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input id="np-portal" type="checkbox" {...form.register("hasPortalAccess")} />
              <Label htmlFor="np-portal" className="font-normal">
                {t("fieldPortalAccess")}
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="np-notes">{t("fieldNotes")}</Label>
              <textarea
                id="np-notes"
                rows={3}
                className={cn(
                  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
                  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                {...form.register("notes")}
              />
            </div>
          </DialogBody>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("saving") : t("createSubmit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
