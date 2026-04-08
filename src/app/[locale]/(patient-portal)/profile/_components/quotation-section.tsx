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
      <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("noQuotation")}</p>
      </div>
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
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-border/40 bg-muted/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-bold tracking-widest border-primary/20 text-primary uppercase">
            {current.packageTier}
          </Badge>
        </div>
        {current.status === "accepted" && (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-transparent text-[10px] px-3 py-0.5">
            {t("accepted")}
          </Badge>
        )}
        {current.status === "rejected" && (
          <Badge className="bg-destructive/10 text-destructive border-transparent text-[10px] px-3 py-0.5">
            {t("rejected")}
          </Badge>
        )}
      </div>

      <div className="p-6 space-y-8">
        <div className="space-y-4">
          {current.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-sm group"
            >
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item.label[langKey]}</span>
              <span className="font-semibold tabular-nums text-foreground">
                ${item.amountUSD.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border/40 pt-6 mt-4">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">{t("total")}</p>
              <p className="text-3xl font-bold tracking-tight text-primary">
                ${current.totalUSD.toLocaleString()}
              </p>
            </div>
            {current.downpaymentRequired && current.downpaymentUSD && (
              <div className="text-end">
                <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1">{t("downpayment")}</p>
                <p className="text-lg font-bold text-foreground">
                  ${current.downpaymentUSD.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-muted/30 border border-border/20 p-4">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Terms & Conditions</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {current.termsAndConditions}
          </p>
        </div>

        {showActions && !showRejectForm && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              size="lg" 
              className="flex-1 rounded-xl shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all font-bold uppercase tracking-wider text-xs"
              onClick={handleAccept}
            >
              {t("approveQuote")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all"
              onClick={() => setShowRejectForm(true)}
            >
              {t("rejectQuote")}
            </Button>
          </div>
        )}

        {showActions && showRejectForm && (
          <div className="space-y-4 pt-4 border-t border-border/40 animate-in slide-in-from-bottom-2">
            <div className="space-y-2">
              <Label htmlFor="reject-reason" className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {t("rejectReason")}
              </Label>
              <textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("rejectReasonPlaceholder")}
                className="min-h-24 w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="flex-1 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                onClick={handleReject}
                disabled={!reason.trim()}
              >
                {t("confirm")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex-1 rounded-lg font-bold uppercase tracking-wider text-[10px]"
                onClick={() => setShowRejectForm(false)}
              >
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
