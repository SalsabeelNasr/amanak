import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listLeads } from "@/lib/api/leads";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import { cn } from "@/lib/utils";

const READY: Array<"estimate_reviewed" | "changes_requested" | "quotation_sent"> = [
  "estimate_reviewed",
  "changes_requested",
  "quotation_sent",
];

export default async function QuotationCreationPage() {
  const t = await getTranslations("crm");
  const locale = await getLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const all = await listLeads();
  const queue = all.filter((l) => READY.includes(l.status as (typeof READY)[number]));

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t("quotationCreation")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("crmTodayHint")}
        </p>
      </header>
      {queue.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("quotationCreationEmpty")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border/60 bg-card">
          {queue.map((lead) => (
            <li
              key={lead.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5"
            >
              <div>
                <p className="font-medium">{lead.patientName}</p>
                <p className="text-xs text-muted-foreground">
                  {lead.treatmentSlug} · {getStatusLabel(lead.status)[langKey]}
                </p>
              </div>
              <Link
                href={`${ROUTES.crmLeads}/${lead.id}`}
                className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                prefetch={false}
              >
                {t("quotationCreationLead")}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-center text-xs text-muted-foreground">
        <Link href={ROUTES.crmLeads} className="underline" prefetch={false}>
          {t("leads")}
        </Link>
      </p>
    </div>
  );
}
