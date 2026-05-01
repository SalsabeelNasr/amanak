"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ConsultationBookingForm } from "@/app/[locale]/(marketing)/contact/_components/consultation-booking-form";
import { DocumentUploadDialog } from "@/components/leads/document-upload-dialog";
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
import { Label } from "@/components/ui/label";
import { getDoctorByIdSync } from "@/lib/api/doctors";
import {
  getGroundTransportSkuById,
  getQuotationHospitalById,
  getQuotationTransportProfile,
} from "@/lib/api/quotation-catalog";
import type { PatientNextActionModalId } from "@/lib/patient-next-action";
import { useSession } from "@/lib/mock-session";
import type { ConsultantProfile, ConsultationSlot, Lead, Quotation } from "@/types";
import { cn } from "@/lib/utils";

type LangKey = "ar" | "en";

function pickQuotationForTransport(lead: Lead): Quotation | undefined {
  if (lead.activeQuotationId) {
    const active = lead.quotations.find((q) => q.id === lead.activeQuotationId);
    if (active) return active;
  }
  return (
    lead.quotations.find((q) => q.status === "accepted" || q.status === "sent_to_patient") ??
    lead.quotations[0]
  );
}

export function PatientNextActionModals({
  activeModal,
  onOpenChange,
  lead,
  initialSlots,
  consultant,
  onDocumentsUpdated,
}: {
  activeModal: PatientNextActionModalId | null;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  initialSlots: ConsultationSlot[];
  consultant: ConsultantProfile;
  /** After a successful document upload (e.g. payment proof), refresh server lead data. */
  onDocumentsUpdated?: () => void;
}) {
  const t = useTranslations("portal");
  const { session } = useSession();
  const tDoctors = useTranslations("doctors");
  const locale = useLocale();
  const langKey: LangKey = locale === "ar" ? "ar" : "en";
  const isRtl = locale === "ar";

  const [callbackSlot, setCallbackSlot] = useState("");
  const [callbackNote, setCallbackNote] = useState("");
  const [callbackSent, setCallbackSent] = useState(false);
  const [reportTravelDone, setReportTravelDone] = useState(false);
  const [reportStayDone, setReportStayDone] = useState(false);
  const [orderCarAck, setOrderCarAck] = useState(false);

  const open = activeModal !== null;

  const resetEphemeral = () => {
    setCallbackSent(false);
    setReportTravelDone(false);
    setReportStayDone(false);
    setOrderCarAck(false);
    setCallbackSlot("");
    setCallbackNote("");
  };

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) resetEphemeral();
    onOpenChange(next);
  };

  const quote = useMemo(() => pickQuotationForTransport(lead), [lead]);
  const transportProfile = useMemo(
    () => getQuotationTransportProfile(lead.treatmentSlug),
    [lead.treatmentSlug],
  );
  const routeCount = quote?.transportRouteCount ?? transportProfile.routeCount;
  const modeLabel = quote?.transportMode ?? transportProfile.modeLabel;
  const groundSku = quote?.groundTransportSkuId
    ? getGroundTransportSkuById(quote.groundTransportSkuId)
    : undefined;
  const hospital = quote?.hospitalId ? getQuotationHospitalById(quote.hospitalId) : undefined;
  const doctor = quote?.doctorId ? getDoctorByIdSync(quote.doctorId) : undefined;
  const doctorName = doctor
    ? tDoctors(doctor.nameKey.replace(/^doctors\./, "") as Parameters<typeof tDoctors>[0])
    : null;

  const slotOptions = [
    t("onboardingSlotMorning"),
    t("onboardingSlotAfternoon"),
    t("onboardingSlotEvening"),
  ];

  const tripRows = useMemo(() => {
    const n = Math.max(1, Math.min(20, routeCount));
    return Array.from({ length: n }, (_, i) => i + 1);
  }, [routeCount]);

  const modalTitle = (id: PatientNextActionModalId): string => {
    const keys: Record<PatientNextActionModalId, Parameters<typeof t>[0]> = {
      request_callback: "nextActionModalRequestCallbackTitle",
      book_call: "nextActionModalBookCallTitle",
      order_car: "nextActionModalOrderCarTitle",
      report_arrival_travel: "nextActionModalReportTravelTitle",
      report_arrival_stay: "nextActionModalReportStayTitle",
      upload_payment_downpayment: "nextActionModalUploadDownpaymentTitle",
      upload_payment_remaining: "nextActionModalUploadRemainingTitle",
    };
    return t(keys[id]);
  };

  const renderBody = () => {
    if (!activeModal) return null;

    if (activeModal === "request_callback") {
      if (callbackSent) {
        return (
          <p className="text-sm text-muted-foreground">{t("nextActionModalMockSuccess")}</p>
        );
      }
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("onboardingContactHint")}</p>
          <div className="space-y-2">
            <Label className="amanak-app-field-label">{t("onboardingContactTime")}</Label>
            <div className="flex flex-col gap-2">
              {slotOptions.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setCallbackSlot(slot)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-start text-sm font-medium transition-colors",
                    callbackSlot === slot
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cb-note" className="amanak-app-field-label">
              {t("nextActionModalOptionalNote")}
            </Label>
            <textarea
              id="cb-note"
              value={callbackNote}
              onChange={(e) => setCallbackNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      );
    }

    if (activeModal === "book_call") {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("nextActionModalBookCallLead")}</p>
          <p className="text-sm text-muted-foreground">{t("onboardingBookSubtitle")}</p>
          <ConsultationBookingForm
            initialSlots={initialSlots}
            consultant={consultant}
            compact
            onBookingConfirmed={() => handleDialogOpenChange(false)}
          />
        </div>
      );
    }

    if (activeModal === "order_car") {
      if (orderCarAck) {
        return <p className="text-sm text-muted-foreground">{t("nextActionModalMockSuccess")}</p>;
      }
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("nextActionModalOrderCarIntro")}</p>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm space-y-2">
            <p>
              <span className="font-medium text-foreground">{t("nextActionModalTripOrigin")}:</span>{" "}
              {t("nextActionModalTripOriginStay")}
            </p>
            <p>
              <span className="font-medium text-foreground">{t("nextActionModalTripDestination")}:</span>{" "}
              {t("nextActionModalTripDestinationCare")}
            </p>
            <p className="text-muted-foreground">{modeLabel[langKey]}</p>
            {groundSku ? (
              <p className="text-muted-foreground">{groundSku.label[langKey]}</p>
            ) : null}
            {typeof quote?.transportPackageTripPlan === "number" ? (
              <p className="text-muted-foreground">
                {t("quotationTransportPackageTrips")}:{" "}
                {t("quotationTransportPackageTripsValue", {
                  count: quote.transportPackageTripPlan,
                })}
              </p>
            ) : null}
            {typeof quote?.transportAirportRoundTrip === "boolean" ? (
              <p className="text-muted-foreground">
                {quote.transportAirportRoundTrip
                  ? t("quotationTransportAirportRoundTrip")
                  : t("quotationTransportAirportOneWay")}
              </p>
            ) : null}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t("nextActionModalIncludedTrips")}
            </p>
            <ul className="space-y-2">
              {tripRows.map((num) => (
                <li
                  key={num}
                  className="rounded-lg border border-border/50 bg-card px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-foreground">
                    {t("nextActionModalTripNumber", { num })}
                  </span>
                  <span className="mx-2 text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{t("nextActionModalTripLegSummary")}</span>
                  {hospital?.name ? (
                    <>
                      <span className="mx-1 text-muted-foreground" aria-hidden>
                        {isRtl ? "←" : "→"}
                      </span>
                      <span className="font-medium text-foreground">{hospital.name}</span>
                    </>
                  ) : null}
                  {doctorName ? (
                    <>
                      <span className="mx-1 text-muted-foreground">·</span>
                      <span className="text-foreground">{doctorName}</span>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">{t("nextActionModalOrderCarFootnote")}</p>
        </div>
      );
    }

    if (activeModal === "report_arrival_travel") {
      if (reportTravelDone) {
        return <p className="text-sm text-muted-foreground">{t("nextActionModalMockSuccess")}</p>;
      }
      return <p className="text-sm text-muted-foreground">{t("nextActionModalReportTravelBody")}</p>;
    }

    if (activeModal === "report_arrival_stay") {
      if (reportStayDone) {
        return <p className="text-sm text-muted-foreground">{t("nextActionModalMockSuccess")}</p>;
      }
      return <p className="text-sm text-muted-foreground">{t("nextActionModalReportStayBody")}</p>;
    }

    return null;
  };

  const showCancel =
    activeModal &&
    activeModal !== "book_call" &&
    !(
      (activeModal === "request_callback" && callbackSent) ||
      (activeModal === "order_car" && orderCarAck) ||
      (activeModal === "report_arrival_travel" && reportTravelDone) ||
      (activeModal === "report_arrival_stay" && reportStayDone)
    );

  const footerPrimary = () => {
    if (!activeModal) return null;
    if (activeModal === "book_call") return null;

    if (activeModal === "request_callback") {
      if (callbackSent) {
        return (
          <Button type="button" onClick={() => handleDialogOpenChange(false)}>
            {t("careRequestCloseSheet")}
          </Button>
        );
      }
      return (
        <Button
          type="button"
          disabled={!callbackSlot.trim()}
          onClick={() => setCallbackSent(true)}
        >
          {t("nextActionModalSubmitRequest")}
        </Button>
      );
    }

    if (activeModal === "order_car") {
      if (orderCarAck) {
        return (
          <Button type="button" onClick={() => handleDialogOpenChange(false)}>
            {t("careRequestCloseSheet")}
          </Button>
        );
      }
      return (
        <Button type="button" onClick={() => setOrderCarAck(true)}>
          {t("nextActionModalSubmitTransportRequest")}
        </Button>
      );
    }

    if (activeModal === "report_arrival_travel") {
      if (reportTravelDone) {
        return (
          <Button type="button" onClick={() => handleDialogOpenChange(false)}>
            {t("careRequestCloseSheet")}
          </Button>
        );
      }
      return (
        <Button type="button" onClick={() => setReportTravelDone(true)}>
          {t("nextActionModalConfirmArrival")}
        </Button>
      );
    }

    if (activeModal === "report_arrival_stay") {
      if (reportStayDone) {
        return (
          <Button type="button" onClick={() => handleDialogOpenChange(false)}>
            {t("careRequestCloseSheet")}
          </Button>
        );
      }
      return (
        <Button type="button" onClick={() => setReportStayDone(true)}>
          {t("nextActionModalConfirmStay")}
        </Button>
      );
    }

    return null;
  };

  if (
    activeModal === "upload_payment_downpayment" ||
    activeModal === "upload_payment_remaining"
  ) {
    const defaultType =
      activeModal === "upload_payment_downpayment"
        ? ("payment_proof_downpayment" as const)
        : ("payment_proof_remaining" as const);
    return (
      <DocumentUploadDialog
        open
        onOpenChange={(next) => {
          if (!next) onOpenChange(false);
        }}
        leadId={lead.id}
        uploadedByUserId={session.user?.id}
        defaultType={defaultType}
        dialogTitle={
          activeModal === "upload_payment_downpayment"
            ? t("nextActionModalUploadDownpaymentTitle")
            : t("nextActionModalUploadRemainingTitle")
        }
        onUploaded={() => {
          onDocumentsUpdated?.();
          onOpenChange(false);
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        size="lg"
        layout="scrollable"
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="flex max-h-[min(90vh,var(--dialog-max-height))] flex-col"
      >
        {activeModal ? (
          <>
            <DialogHeader>
              <DialogTitle>{modalTitle(activeModal)}</DialogTitle>
              <DialogDescription>{t("nextActionModalDemoHint")}</DialogDescription>
            </DialogHeader>
            <DialogBody className="py-2">{renderBody()}</DialogBody>
            {activeModal !== "book_call" ? (
              <DialogFooter>
                {showCancel ? (
                  <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
                    {t("cancel")}
                  </Button>
                ) : null}
                {footerPrimary()}
              </DialogFooter>
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
