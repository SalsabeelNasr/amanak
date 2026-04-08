"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Quotation } from "@/types";

export function QuotationSection({
  quotation,
}: {
  quotation: Quotation | null;
}) {
  const t = useTranslations("portal");
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const [current, setCurrent] = useState<Quotation | null>(quotation);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");

  if (!current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("quotation")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("noQuotation")}</p>
        </CardContent>
      </Card>
    );
  }

  function handleAccept() {
    setCurrent((prev) => (prev ? { ...prev, status: "accepted" } : prev));
  }

  function handleReject() {
    if (!reason.trim()) return;
    setCurrent((prev) => (prev ? { ...prev, status: "rejected" } : prev));
    setShowRejectForm(false);
  }

  const showActions = current.status === "sent_to_patient";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t("quotation")}</span>
          <Badge variant="default" className="uppercase">
            {current.packageTier}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {current.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-foreground">{item.label[langKey]}</span>
              <span className="font-medium tabular-nums text-muted-foreground">
                ${item.amountUSD.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold">
            <span>{t("total")}</span>
            <span className="tabular-nums text-primary">
              ${current.totalUSD.toLocaleString()}
            </span>
          </div>
          {current.downpaymentRequired && current.downpaymentUSD && (
            <p className="text-xs text-muted-foreground">
              {t("downpayment")}: ${current.downpaymentUSD.toLocaleString()}
            </p>
          )}
        </div>

        <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
          {current.termsAndConditions}
        </p>

        {current.status === "accepted" && (
          <Badge variant="default">{t("accepted")}</Badge>
        )}
        {current.status === "rejected" && (
          <Badge variant="destructive">{t("rejected")}</Badge>
        )}

        {showActions && !showRejectForm && (
          <div className="flex gap-3">
            <Button type="button" size="lg" onClick={handleAccept}>
              {t("approveQuote")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setShowRejectForm(true)}
            >
              {t("rejectQuote")}
            </Button>
          </div>
        )}

        {showActions && showRejectForm && (
          <div className="space-y-2">
            <Label htmlFor="reject-reason">{t("rejectReason")}</Label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("rejectReasonPlaceholder")}
              className="min-h-20 w-full rounded-md border border-border bg-card p-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={!reason.trim()}
              >
                {t("confirm")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowRejectForm(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
