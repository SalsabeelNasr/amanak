import { getTranslations } from "next-intl/server";
import { listLeads } from "@/lib/api/leads";
import { LeadsTable } from "./_components/leads-table";

export default async function CrmLeadsPage() {
  const t = await getTranslations("crm");
  const leads = await listLeads();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("leads")}</h1>
      <LeadsTable leads={leads} />
    </div>
  );
}
