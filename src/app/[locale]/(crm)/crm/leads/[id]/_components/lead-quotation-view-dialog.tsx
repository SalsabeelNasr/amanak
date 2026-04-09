"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Quotation } from "@/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  locale: string;
};

export function LeadQuotationViewDialog({
  open,
  onOpenChange,
  quotation,
  locale,
}: Props) {
  const t = useTranslations("crm.leadQuotation");
  const langKey = locale === "ar" ? "ar" : "en";

  if (!quotation) return null;

  const tierLabel = t(`tiers.${quotation.packageTier}` as Parameters<typeof t>[0]);
  const statusLabel = t(
    `viewStatus.${quotation.status}` as Parameters<typeof t>[0],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={locale === "ar" ? "rtl" : "ltr"}
        size="xl"
        layout="scrollable"
      >
        <DialogHeader>
          <DialogTitle>{t("viewTitle")}</DialogTitle>
          <DialogDescription>
            {t("viewMeta", {
              version: quotation.version,
              id: quotation.id,
            })}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs font-semibold">
              {tierLabel}
            </Badge>
            <Badge variant="secondary" className="text-xs font-semibold">
              {statusLabel}
            </Badge>
          </div>

          <div className="space-y-4">
            {quotation.items.map((item, i) => (
              <div
                key={`${quotation.id}-item-${i}`}
                className="flex items-center justify-between gap-4 text-sm"
              >
                <span className="font-medium text-muted-foreground">
                  {item.label[langKey]}
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-foreground">
                  ${item.amountUSD.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="amanak-app-field-label mb-1">{t("viewTotal")}</p>
                <p className="text-2xl font-bold tracking-tight text-primary">
                  ${quotation.totalUSD.toLocaleString()}
                </p>
              </div>
              {quotation.downpaymentRequired && quotation.downpaymentUSD != null ? (
                <div className="text-start sm:text-end">
                  <p className="amanak-app-field-label mb-1">{t("viewDownpayment")}</p>
                  <p className="text-lg font-bold tabular-nums">
                    ${quotation.downpaymentUSD.toLocaleString()}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-muted/30 p-4">
            <p className="amanak-app-field-label mb-2">{t("termsLabel")}</p>
            <p className="text-xs font-medium leading-relaxed text-muted-foreground">
              {quotation.termsAndConditions}
            </p>
          </div>
        </DialogBody>

        <DialogFooter className="mt-4 border-t border-border pt-4">
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl text-sm font-semibold"
            onClick={() => onOpenChange(false)}
          >
            {t("viewClose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
