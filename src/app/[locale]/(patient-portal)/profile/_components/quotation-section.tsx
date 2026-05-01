"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DocumentUploadDialog } from "@/components/leads/document-upload-dialog";
import { useSession } from "@/lib/mock-session";
import type { Lead, Quotation } from "@/types";
import { cn } from "@/lib/utils";
import { PatientQuotationDetails } from "./patient-quotation-details";

export function QuotationSection({
  quotations,
  activeQuotationId,
  treatmentSlug,
  clientType,
  leadId,
  onPaymentProofUploaded,
}: {
  quotations: Quotation[];
  activeQuotationId?: string;
  treatmentSlug: string;
  clientType: Lead["clientType"];
  leadId: string;
  /** Optional: parent can refresh data after a successful upload. */
  onPaymentProofUploaded?: (lead: Lead) => void;
}) {
  const t = useTranslations("portal");
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const amountLocaleTag = langKey === "ar" ? "ar-EG" : "en-US";
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, Quotation["status"]>>({});
  const [showRejectFormForId, setShowRejectFormForId] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [paymentUploadOpen, setPaymentUploadOpen] = useState(false);
  const { session } = useSession();

  const openPaymentProofUpload = useCallback(() => {
    setPaymentUploadOpen(true);
  }, []);

  if (!quotations.length) {
    return (
      <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">{t("noQuotation")}</p>
      </div>
    );
  }

  function statusFor(quote: Quotation): Quotation["status"] {
    return localStatuses[quote.id] ?? quote.status;
  }

  function handleAccept(quoteId: string) {
    setLocalStatuses((prev) => ({ ...prev, [quoteId]: "accepted" }));
    setShowRejectFormForId((prev) => (prev === quoteId ? null : prev));
  }

  function handleReject(quoteId: string) {
    const reason = rejectionReasons[quoteId]?.trim();
    if (!reason) return;
    setLocalStatuses((prev) => ({ ...prev, [quoteId]: "rejected" }));
    setShowRejectFormForId((prev) => (prev === quoteId ? null : prev));
  }

  return (
    <div className="space-y-3">
      <DocumentUploadDialog
        open={paymentUploadOpen}
        onOpenChange={setPaymentUploadOpen}
        leadId={leadId}
        uploadedByUserId={session.user?.id}
        defaultType="payment_proof_downpayment"
        onUploaded={(updated) => {
          onPaymentProofUploaded?.(updated);
        }}
      />
      {quotations.map((quote) => {
        const quoteStatus = statusFor(quote);
        const showActions = quoteStatus === "sent_to_patient";
        const showRejectForm = showRejectFormForId === quote.id;
        const reason = rejectionReasons[quote.id] ?? "";
        const isOpen = openQuoteId === quote.id;

        return (
          <div
            key={quote.id}
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm",
              quote.id === activeQuotationId && "border-primary/30 ring-1 ring-primary/10",
            )}
          >
            {quote.id === activeQuotationId ? (
              <div className="absolute start-0 top-0 h-full w-3 bg-primary" />
            ) : null}
            <button
              type="button"
              onClick={() => setOpenQuoteId((prev) => (prev === quote.id ? null : quote.id))}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-5 py-4 text-start",
                quote.id === activeQuotationId && "ps-7",
              )}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-2xl font-bold tracking-tight text-primary">
                  <span>${quote.totalUSD.toLocaleString(amountLocaleTag)}</span>
                  <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                    #{quote.id}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {quote.id === activeQuotationId ? (
                  <Badge className="bg-primary/10 text-primary border-transparent text-[10px] px-2 py-0.5">
                    {t("active")}
                  </Badge>
                ) : null}
                {quoteStatus === "accepted" ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-transparent text-[10px] px-3 py-0.5">
                    {t("accepted")}
                  </Badge>
                ) : null}
                {quoteStatus === "rejected" ? (
                  <Badge className="bg-destructive/10 text-destructive border-transparent text-[10px] px-3 py-0.5">
                    {t("rejected")}
                  </Badge>
                ) : null}
                <ChevronDown
                  className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </div>
            </button>

            {isOpen ? (
              <div className="border-t border-border/40 p-5 space-y-6">
                <PatientQuotationDetails
                  quote={quote}
                  quoteStatus={statusFor(quote)}
                  treatmentSlug={treatmentSlug}
                  clientType={clientType}
                  langKey={langKey}
                  locale={locale}
                  onUploadPaymentProof={openPaymentProofUpload}
                />

                {showActions && !showRejectForm ? (
                  <div className="flex flex-row flex-wrap justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRejectFormForId(quote.id)}
                    >
                      {t("rejectQuote")}
                    </Button>
                    <Button type="button" onClick={() => handleAccept(quote.id)}>
                      {t("approveQuote")}
                    </Button>
                  </div>
                ) : null}

                {showActions && showRejectForm ? (
                  <div className="space-y-4 pt-2 border-t border-border/40">
                    <div className="space-y-2">
                      <Label htmlFor={`reject-reason-${quote.id}`} className="amanak-app-field-label">
                        {t("rejectReason")}
                      </Label>
                      <textarea
                        id={`reject-reason-${quote.id}`}
                        value={reason}
                        onChange={(e) =>
                          setRejectionReasons((prev) => ({ ...prev, [quote.id]: e.target.value }))
                        }
                        placeholder={t("rejectReasonPlaceholder")}
                        className="min-h-24 w-full rounded-xl border border-border bg-background p-4 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="flex-1 rounded-lg text-sm font-medium"
                        onClick={() => handleReject(quote.id)}
                        disabled={!reason.trim()}
                      >
                        {t("confirm")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="flex-1 rounded-lg text-sm font-medium"
                        onClick={() => setShowRejectFormForId(null)}
                      >
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
