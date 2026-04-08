import { getTranslations } from "next-intl/server";
import { listLeads } from "@/lib/api/leads";
import { LeadsTable } from "./_components/leads-table";

export default async function CrmLeadsPage() {
  const t = await getTranslations("crm");
  const leads = await listLeads();

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-8">
      <header className="flex flex-col gap-2 border-b border-border/40 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("leads")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {leads.length} {t("totalLeads")}
        </p>
      </header>
      <LeadsTable leads={leads} />
    </div>
  );
}
