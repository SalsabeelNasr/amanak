import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/components/crm/date-format";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { Patient } from "@/types";
import { ChevronRight, Clock, MapPin, Shield } from "lucide-react";

export type PatientListRow = {
  patient: Patient;
  openCount: number;
  closedCount: number;
  lastActivity: string;
};

function translatedClientType(
  clientType: Patient["clientType"],
  t: (key: string) => string,
): string {
  switch (clientType) {
    case "b2c":
      return t("clientTypes.b2c");
    case "b2b":
      return t("clientTypes.b2b");
    case "g2b":
      return t("clientTypes.g2b");
    default:
      return clientType;
  }
}

export async function PatientsCardGrid({ rows }: { rows: PatientListRow[] }) {
  const t = await getTranslations("crm.patientsPage");
  const tCrm = await getTranslations("crm");
  const locale = await getLocale();

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center text-sm text-muted-foreground">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {rows.map(({ patient, openCount, closedCount, lastActivity }) => (
        <Link
          key={patient.id}
          href={`${ROUTES.crmPatients}/${patient.id}`}
          prefetch={false}
          className="group block min-w-0"
        >
          <div
            className={cn(
              "flex flex-col overflow-hidden amanak-app-surface-card shadow-none",
              "transition-shadow duration-200 hover:shadow-sm hover:shadow-primary/5 active:scale-[0.99]",
              "p-3 lg:py-2.5 lg:px-3",
            )}
          >
            <div className="flex min-h-0 flex-col gap-2 lg:hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-lg sm:font-bold">
                    {patient.name}
                  </h2>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground sm:text-sm">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {patient.country}
                    </span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                      <Shield className="size-3.5 shrink-0" aria-hidden />
                      {translatedClientType(patient.clientType, tCrm)}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={patient.hasPortalAccess ? "default" : "secondary"}
                  className={cn(
                    "shrink-0 text-[10px] font-bold uppercase",
                    patient.hasPortalAccess &&
                      "border-emerald-200 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                  )}
                >
                  {patient.hasPortalAccess ? t("portalYes") : t("portalNo")}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                <span>
                  {t("cardOpen")}{" "}
                  <span className="font-semibold tabular-nums text-foreground">{openCount}</span>
                  {" · "}
                  {t("cardClosed")}{" "}
                  <span className="font-semibold tabular-nums text-foreground">{closedCount}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="size-3.5 shrink-0 opacity-70" aria-hidden />
                  {formatDate(lastActivity, locale)}
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    aria-hidden
                  />
                </span>
              </div>
            </div>

            <div className="hidden min-h-0 items-center justify-between gap-2 lg:flex">
              <div className="min-w-0 flex-1 space-y-0.5">
                <h2 className="truncate text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                  {patient.name}
                </h2>
                <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex min-w-0 items-center gap-0.5">
                    <MapPin className="size-3 shrink-0" aria-hidden />
                    <span className="truncate">{patient.country}</span>
                  </span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="flex items-center gap-0.5 font-medium text-foreground/75">
                    <Shield className="size-3 shrink-0" aria-hidden />
                    {translatedClientType(patient.clientType, tCrm)}
                  </span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="tabular-nums">
                    {t("cardOpen")} {openCount} · {t("cardClosed")} {closedCount}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <Badge
                  variant={patient.hasPortalAccess ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    patient.hasPortalAccess &&
                      "border-emerald-200 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                  )}
                >
                  {patient.hasPortalAccess ? t("portalYes") : t("portalNo")}
                </Badge>
                <div className="flex items-center gap-0.5 whitespace-nowrap text-[11px] font-medium text-muted-foreground tabular-nums">
                  <Clock className="size-3 shrink-0 opacity-70" aria-hidden />
                  {formatDate(lastActivity, locale)}
                </div>
                <ChevronRight
                  className="size-3.5 shrink-0 text-muted-foreground/35 transition-all group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
