import { getTranslations } from "next-intl/server";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import { LeadsTable } from "./_components/leads-table";

export default async function CrmLeadsPage() {
  const t = await getTranslations("crm");
  const leads = await crm.leads.list(undefined, getServerCrmCtx());
  const settings = await crm.settings.get(getServerCrmCtx());

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
      <header className="flex flex-col gap-2 border-b border-border/40 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="amanak-app-page-title">{t("leads")}</h1>
        <p className="text-sm text-muted-foreground">
          {leads.length} {t("totalLeads")}
        </p>
      </header>
      <LeadsTable leads={leads} settings={settings} />
    </div>
  );
}
