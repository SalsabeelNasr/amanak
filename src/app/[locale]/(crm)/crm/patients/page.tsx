import { getTranslations } from "next-intl/server";
import { crm } from "@/lib/crm/client";
import { getServerCrmCtx } from "@/lib/crm/ctx";
import { isTerminalState } from "@/lib/services/state-machine.service";
import type { PatientFilters } from "@/lib/api/patients";
import { PatientsPageToolbar } from "./_components/patients-page-toolbar";
import { PatientsPageFilters } from "./_components/patients-page-filters";
import { PatientsCardGrid } from "./_components/patients-card-grid";

type Search = {
  q?: string;
  clientType?: string;
  portal?: string;
  open?: string;
};

function parseFilters(search: Search): PatientFilters {
  const filters: PatientFilters = {};
  if (search.q?.trim()) filters.search = search.q.trim();
  if (search.clientType === "b2c" || search.clientType === "b2b" || search.clientType === "g2b") {
    filters.clientType = search.clientType;
  }
  if (search.portal === "1") filters.hasPortalAccess = true;
  if (search.portal === "0") filters.hasPortalAccess = false;
  return filters;
}

export default async function CrmPatientsPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const t = await getTranslations("crm.patientsPage");
  const raw = searchParams ? await searchParams : {};
  const filters = parseFilters(raw);
  const ctx = getServerCrmCtx();
  const patients = await crm.patients.list(filters, ctx);

  const rows = await Promise.all(
    patients.map(async (p) => {
      const requests = await crm.requests.list({ patientId: p.id }, ctx);
      const openCount = requests.filter((r) => !isTerminalState(r.status)).length;
      const closedCount = requests.filter((r) => isTerminalState(r.status)).length;
      const last =
        requests.length > 0
          ? requests
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
              )[0]!.updatedAt
          : p.updatedAt;
      return { patient: p, openCount, closedCount, lastActivity: last };
    }),
  );

  const wantOpen = raw.open === "1";
  const filtered = wantOpen ? rows.filter((r) => r.openCount > 0) : rows;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
      <header className="flex flex-col gap-2 border-b border-border/40 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="amanak-app-page-title">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <PatientsPageToolbar />
      </header>

      <PatientsPageFilters
        initialQ={raw.q ?? ""}
        initialClientType={raw.clientType ?? ""}
        initialPortal={raw.portal ?? ""}
        initialOpen={wantOpen}
      />

      <PatientsCardGrid rows={filtered} />
    </div>
  );
}
