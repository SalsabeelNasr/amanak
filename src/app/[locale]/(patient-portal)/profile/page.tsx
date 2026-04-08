import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JourneyTimeline } from "@/components/portal/journey-timeline";
import { getLeadById } from "@/lib/api/leads";
import { DocumentsSection } from "./_components/documents-section";
import { QuotationSection } from "./_components/quotation-section";

export default async function PatientProfilePage() {
  const t = await getTranslations("portal");
  const lead = await getLeadById("lead_1");
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("personalInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">{t("fullName")}</p>
            <p className="font-medium text-foreground">{lead.patientName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("phone")}</p>
            <p className="font-medium text-foreground">{lead.patientPhone}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("country")}</p>
            <p className="font-medium text-foreground">{lead.patientCountry}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("clientType")}</p>
            <Badge variant="secondary" className="uppercase">
              {lead.clientType}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("journey")}</CardTitle>
        </CardHeader>
        <CardContent>
          <JourneyTimeline lead={lead} />
        </CardContent>
      </Card>

      <DocumentsSection initialDocuments={lead.documents} />

      <QuotationSection
        quotation={
          lead.activeQuotationId
            ? lead.quotations.find((q) => q.id === lead.activeQuotationId) ??
              null
            : null
        }
      />
    </div>
  );
}
