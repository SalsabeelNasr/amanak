"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Image as ImageIcon,
  FlaskConical,
  BookOpen,
  Upload,
  CircleCheck,
  Banknote,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentUploadDialog } from "@/components/leads/document-upload-dialog";
import { useSession } from "@/lib/mock-session";
import { cn } from "@/lib/utils";
import type { Lead, LeadDocument, Quotation } from "@/types";
import { DocumentFileRow } from "./document-file-row";

function iconFor(type: LeadDocument["type"]) {
  switch (type) {
    case "xray":
      return ImageIcon;
    case "lab_result":
      return FlaskConical;
    case "passport":
    case "visa":
      return BookOpen;
    case "payment_proof_downpayment":
    case "payment_proof_remaining":
      return Banknote;
    default:
      return FileText;
  }
}

export function DocumentsSection({
  leadId,
  initialDocuments,
  paymentQuotation,
  initialPaymentUpload,
}: {
  leadId: string;
  initialDocuments: LeadDocument[];
  /** Quotation used for down payment / remaining amounts (accepted, or active sent quote). */
  paymentQuotation?: Quotation | null;
  initialPaymentUpload?: "downpayment" | "remaining" | null;
}) {
  const t = useTranslations("portal");
  const { session } = useSession();
  const [docs, setDocs] = useState<LeadDocument[]>(initialDocuments);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDefaultType, setUploadDefaultType] = useState<LeadDocument["type"] | undefined>();

  const paymentIntentOpened = useRef(false);

  const missingMandatory = useMemo(
    () => docs.filter((d) => d.mandatory && d.status === "pending"),
    [docs],
  );

  const downpaymentUsd = useMemo(() => {
    if (!paymentQuotation?.downpaymentRequired || paymentQuotation.downpaymentUSD == null) {
      return null;
    }
    return paymentQuotation.downpaymentUSD;
  }, [paymentQuotation]);

  const openUpload = useCallback((type?: LeadDocument["type"]) => {
    setUploadDefaultType(type);
    setUploadOpen(true);
  }, []);

  useEffect(() => {
    if (paymentIntentOpened.current || !initialPaymentUpload || !paymentQuotation) return;
    paymentIntentOpened.current = true;
    const type: LeadDocument["type"] =
      initialPaymentUpload === "downpayment" && downpaymentUsd != null
        ? "payment_proof_downpayment"
        : "payment_proof_remaining";
    openUpload(type);
  }, [initialPaymentUpload, paymentQuotation, downpaymentUsd, openUpload]);

  const onUploaded = useCallback((updated: Lead) => {
    setDocs(updated.documents);
  }, []);

  const renderPaymentProofRow = (
    docType: "payment_proof_downpayment" | "payment_proof_remaining",
    hint: string,
  ) => {
    const doc = docs.find((d) => d.type === docType);
    const isUploaded = doc?.status === "uploaded" || doc?.status === "verified";
    const Icon = iconFor(docType);
    return (
      <DocumentFileRow
        leading={<Icon className="size-6 text-primary/70" aria-hidden />}
        primary={t(`docType_${docType}`)}
        secondary={hint}
        badges={
          isUploaded ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <CircleCheck className="size-3.5" aria-hidden />
              {t("paymentProofUploadedLabel")}
            </span>
          ) : null
        }
        action={
          <Button
            type="button"
            variant={isUploaded ? "outline" : "default"}
            size="sm"
            className="h-8 gap-1.5 rounded-lg text-xs font-medium"
            onClick={() => openUpload(docType)}
          >
            <Upload className="size-3.5" aria-hidden />
            {isUploaded ? t("paymentProofReplaceUpload") : t("paymentProofUploadProof")}
          </Button>
        }
      />
    );
  };

  const checklistDocs = useMemo(
    () =>
      docs.filter(
        (d) => d.type !== "payment_proof_downpayment" && d.type !== "payment_proof_remaining",
      ),
    [docs],
  );

  return (
    <div className="space-y-4">
      {missingMandatory.length > 0 ? (
        <div
          className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm"
          role="status"
        >
          <p className="font-semibold text-foreground">
            {t("missingRequiredTitle", { count: missingMandatory.length })}
          </p>
          <p className="mt-1 text-muted-foreground">{t("missingRequiredHint")}</p>
          <ul className="mt-2 list-inside list-disc font-medium text-foreground/90">
            {missingMandatory.slice(0, 5).map((d) => (
              <li key={d.id}>{d.name}</li>
            ))}
          </ul>
          {missingMandatory.length > 5 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("moreMissingCount", { count: missingMandatory.length - 5 })}
            </p>
          ) : null}
        </div>
      ) : null}

      {paymentQuotation ? (
        <div className="space-y-5">
          <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
            {t("paymentProofSectionTitle")}
          </h2>

          {downpaymentUsd != null ? (
            <section
              className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5"
              aria-labelledby="files-payment-downpayment-heading"
            >
              <header id="files-payment-downpayment-heading" className="mb-4 border-b border-border/40 pb-3">
                <h3 className="text-base font-bold tracking-tight text-foreground">
                  {t("paymentProofDownpaymentFilesSectionTitle")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("paymentProofDownpaymentFilesSectionDescription")}
                </p>
              </header>
              {renderPaymentProofRow(
                "payment_proof_downpayment",
                t("paymentProofDownpaymentCardHint"),
              )}
            </section>
          ) : null}

          <section
            className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm sm:p-5"
            aria-labelledby="files-payment-remaining-heading"
          >
            <header id="files-payment-remaining-heading" className="mb-4 border-b border-border/40 pb-3">
              <h3 className="text-base font-bold tracking-tight text-foreground">
                {t("paymentProofRemainingFilesSectionTitle")}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("paymentProofRemainingFilesSectionDescription")}
              </p>
            </header>
            {renderPaymentProofRow("payment_proof_remaining", t("paymentProofRemainingCardHint"))}
          </section>
        </div>
      ) : null}

      <div className="space-y-3">
        {checklistDocs.length === 0 && !paymentQuotation ? (
          <p className="col-span-full rounded-2xl border border-dashed border-border bg-muted/10 py-8 text-center text-sm text-muted-foreground">
            {t("noDocs")}
          </p>
        ) : null}
        {checklistDocs.length === 0 && paymentQuotation ? (
          <p className="text-xs text-muted-foreground">{t("paymentProofNoOtherDocs")}</p>
        ) : null}
        {checklistDocs.map((doc) => {
          const Icon = iconFor(doc.type);
          const isUploaded = doc.status === "uploaded" || doc.status === "verified";
          const primary = isUploaded ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert(`Opening ${doc.name}...`);
              }}
              className="block truncate"
              title={t("viewFile")}
            >
              {doc.name}
            </a>
          ) : (
            <p className="truncate">{doc.name}</p>
          );

          const leading = isUploaded ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert(`Opening ${doc.name}...`);
              }}
              className="flex size-full items-center justify-center"
              title={t("viewFile")}
            >
              <Icon className="size-6 text-primary/70" aria-hidden />
            </a>
          ) : (
            <Icon className="size-6 text-primary/70" aria-hidden />
          );

          return (
            <DocumentFileRow
              key={doc.id}
              leading={leading}
              primary={primary}
              secondary={t(`docType_${doc.type}`)}
              pendingHighlight={doc.mandatory && doc.status === "pending"}
              badges={
                <>
                  <Badge
                    variant={doc.mandatory ? "default" : "secondary"}
                    className="px-2 py-0 text-[10px]"
                  >
                    {doc.mandatory ? t("mandatory") : t("optional")}
                  </Badge>
                  {isUploaded ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <CircleCheck className="size-3.5" aria-hidden />
                    </span>
                  ) : null}
                  {doc.status === "verified" ? (
                    <Badge className="border-transparent bg-emerald-500/10 px-2 py-0 text-[10px] text-emerald-600">
                      {t("docVerified")}
                    </Badge>
                  ) : null}
                  {doc.status === "uploaded" ? (
                    <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                      {t("docUploaded")}
                    </Badge>
                  ) : null}
                </>
              }
              action={
                <Button
                  type="button"
                  variant={doc.status === "pending" ? "default" : "outline"}
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg text-xs font-medium"
                  onClick={() => openUpload(doc.type)}
                >
                  <Upload className="size-3.5" aria-hidden />
                  {doc.status === "pending" ? t("uploadDoc") : t("uploadFileButton")}
                </Button>
              }
            />
          );
        })}
      </div>

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        leadId={leadId}
        uploadedByUserId={session.user?.id}
        defaultType={uploadDefaultType}
        onUploaded={onUploaded}
      />
    </div>
  );
}
