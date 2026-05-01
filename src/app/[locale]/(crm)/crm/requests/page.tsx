import { getTranslations } from "next-intl/server";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import { RequestsTable } from "./_components/requests-table";

export default async function CrmRequestsPage() {
  const t = await getTranslations("crm");
  const ctx = getServerCrmCtx();
  const [requests, patients] = await Promise.all([
    crm.requests.list(undefined, ctx),
    crm.patients.list(undefined, ctx),
  ]);
  const patientsById = Object.fromEntries(patients.map((p) => [p.id, p]));
  const settings = await crm.settings.get(ctx);

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
      <header className="flex flex-col gap-2 border-b border-border/40 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="amanak-app-page-title">{t("requests")}</h1>
        <p className="text-sm text-muted-foreground">
          {requests.length} {t("totalRequests")}
        </p>
      </header>
      <RequestsTable
        requests={requests}
        patientsById={patientsById}
        settings={settings}
      />
    </div>
  );
}
