/**
 * In-memory CRM settings (mock). Replace with API when backend exists.
 */
import type {
  ContactNudgeRule,
  Lead,
  LeadStatus,
  LeadTaskTemplateKey,
  PackageTier,
} from "@/types";
import { applyMockDelay } from "./mock-delay";
import type {
  EstimateAreaZone,
  EstimateCountryBand,
  EstimateTimingPreference,
} from "@/lib/api/patient-estimate-catalog";

export type QuotationTaskGates = {
  requireQualification: boolean;
  requireDocuments: boolean;
  requireInitialConsultation: boolean;
  /** System may spawn `prepare_quotation` only in these lead statuses (after other gates). */
  allowedPrepareQuotationStatuses: LeadStatus[];
};

export type CostBandRange = { min: number; mid: number; max: number };

export type CostBandsConfig = {
  flight: CostBandRange;
  accommodation: CostBandRange;
  transport: CostBandRange;
  treatment: CostBandRange;
};

export type QuotationTtlConfig = {
  daysUntilExpiry: number;
  /** Days before expiry to show warning. */
  warningOffsets: number[];
  channels: ("email" | "in_app" | "whatsapp")[];
};

export type LeadPriorityRulesConfig = {
  emailAndTreatmentIsLow: boolean;
  withPhoneBumpsToNormal: boolean;
  withTravelFieldsBumpsToHot: boolean;
};

export type TaskRulesLightV1 = {
  /** When true, `ensureSystemTasks` spawns `collect_documents` if mandatory docs are missing. */
  spawnCollectWhenMandatoryDocsMissing: boolean;
  /** When true, `initial_consultation` is auto-suggested after qualification (and document gate for initial, see lead-task-rules). */
  spawnInitialConsultation: boolean;
  /**
   * Hours after creation for the open `lead_qualification` task due date when the lead has no
   * appointments. Ignored when any appointment exists (earliest `startsAt` is used instead).
   */
  leadQualificationSlaHours: number;
};

export type SortingRuleId =
  | "overdue_tasks"
  | "tasks_due_today"
  | "recent_activity"
  | "new_leads"
  | "hot_priority"
  /** Boost leads that still have incomplete tasks of selected template types (see {@link SortingRule.taskTemplateKeys}). */
  | "open_matching_tasks";

export type SortingRule = {
  id: SortingRuleId;
  enabled: boolean;
  label: { ar: string; en: string };
  /** For `open_matching_tasks`: which system task types must still be open (incomplete). */
  taskTemplateKeys?: LeadTaskTemplateKey[];
  /** `any` = at least one listed type has an open task; `all` = every listed type has at least one open task. */
  taskOpenMatch?: "any" | "all";
};

export type QuotationRulesConfig = {
  /**
   * B2C quotations: down payment as a percent of quote total (0 = no down payment line).
   * The amount is still bounded by a minimum USD floor and maximum share of total in
   * `quotation-price-engine.ts`.
   */
  downpaymentPercentB2c: number;
  /**
   * CRM display only: estimated share of the physician procedure fee shown in quotation UI.
   */
  doctorOutCommissionPercent: number;
  /**
   * CRM display only: estimated share of the hospital / facility fee shown in quotation UI.
   */
  hospitalOutCommissionPercent: number;
};

/** Rounded USD commission helper for quotation wizard / view (not added to quotation totals). */
export function computeQuotationOutCommissionUsd(
  lineUsd: number,
  percent: number,
): number {
  if (!Number.isFinite(lineUsd) || lineUsd <= 0) return 0;
  const p =
    typeof percent === "number" && Number.isFinite(percent)
      ? Math.min(100, Math.max(0, percent))
      : 0;
  if (p <= 0) return 0;
  return Math.round((lineUsd * p) / 100);
}

export type CrmSettings = {
  quotationTaskGates: QuotationTaskGates;
  /** Quotation pipeline: B2C down payment %, etc. */
  quotationRules: QuotationRulesConfig;
  costBands: CostBandsConfig;
  quotationTtl: QuotationTtlConfig;
  leadPriority: LeadPriorityRulesConfig;
  contactNurture: { rules: ContactNudgeRule[] };
  taskRules: TaskRulesLightV1;
  sortingRules: SortingRule[];
  estimateParameters: EstimateParametersConfig;
};

export type EstimateParametersConfig = {
  countryBandFlightRanges: Record<EstimateCountryBand, CostBandRange>;
  areaAccommodationRanges: Record<EstimateAreaZone, CostBandRange>;
  areaTransportRanges: Record<EstimateAreaZone, CostBandRange>;
  treatmentTripCountAssumptions: Record<string, number>;
  /**
   * Optional finer rules: overrides {@link treatmentTripCountAssumptions} for a treatment when both
   * treatment and hospital/service area ({@link EstimateAreaZone}) are known (CRM quotations).
   */
  treatmentAreaTripCountAssumptions: Record<
    string,
    Partial<Record<EstimateAreaZone, number>>
  >;
  /**
   * Optional recommended accommodation nights (quotations): overrides default stay heuristic when set.
   */
  treatmentAreaAccommodationNightsAssumptions: Record<
    string,
    Partial<Record<EstimateAreaZone, number>>
  >;
  doctorAdjustmentPct: number;
  hospitalAdjustmentPct: number;
  travelerAdditionalPct: number;
  timingMultipliers: Record<EstimateTimingPreference, number>;
};

const DEFAULTS: CrmSettings = {
  // ... existing defaults ...
  quotationTaskGates: {
    requireQualification: true,
    requireDocuments: true,
    requireInitialConsultation: true,
    allowedPrepareQuotationStatuses: [
      "estimate_requested",
      "estimate_reviewed",
      "quotation_sent",
      "changes_requested",
    ],
  },
  quotationRules: {
    /** Matches previous hardcoded default in the price engine (~22%). */
    downpaymentPercentB2c: 22,
    doctorOutCommissionPercent: 8,
    hospitalOutCommissionPercent: 6,
  },
  costBands: {
    flight: { min: 200, mid: 450, max: 900 },
    accommodation: { min: 50, mid: 120, max: 350 },
    transport: { min: 30, mid: 80, max: 200 },
    treatment: { min: 2000, mid: 5500, max: 15000 },
  },
  quotationTtl: {
    daysUntilExpiry: 14,
    warningOffsets: [7, 3, 1],
    channels: ["email", "in_app"],
  },
  leadPriority: {
    emailAndTreatmentIsLow: true,
    withPhoneBumpsToNormal: true,
    withTravelFieldsBumpsToHot: true,
  },
  contactNurture: {
    rules: [
      {
        id: "nudge_1",
        order: 0,
        delayDays: 2,
        channel: "email",
        templateKey: "nudge_followup_no_reply",
        enabled: true,
      },
      {
        id: "nudge_2",
        order: 1,
        delayDays: 5,
        channel: "whatsapp",
        templateKey: "nudge_whatsapp_touch",
        enabled: true,
      },
    ],
  },
  taskRules: {
    spawnCollectWhenMandatoryDocsMissing: true,
    spawnInitialConsultation: true,
    leadQualificationSlaHours: 24,
  },
  sortingRules: [
    {
      id: "overdue_tasks",
      enabled: true,
      label: { ar: "المهام المتأخرة", en: "Overdue tasks" },
    },
    {
      id: "tasks_due_today",
      enabled: true,
      label: { ar: "مهام اليوم", en: "Tasks due today" },
    },
    {
      id: "open_matching_tasks",
      enabled: true,
      taskTemplateKeys: ["prepare_quotation", "collect_documents"],
      taskOpenMatch: "any",
      label: { ar: "مهام مفتوحة من الأنواع المختارة", en: "Open tasks (types you pick)" },
    },
    {
      id: "hot_priority",
      enabled: true,
      label: { ar: "أولوية قصوى", en: "Hot priority" },
    },
    {
      id: "new_leads",
      enabled: true,
      label: { ar: "عملاء جدد", en: "New leads" },
    },
    {
      id: "recent_activity",
      enabled: true,
      label: { ar: "آخر النشاطات", en: "Recent activity" },
    },
  ],
  estimateParameters: {
    countryBandFlightRanges: {
      regional: { min: 140, mid: 240, max: 380 },
      medium_haul: { min: 280, mid: 450, max: 700 },
      long_haul: { min: 520, mid: 850, max: 1300 },
    },
    areaAccommodationRanges: {
      metro: { min: 45, mid: 90, max: 150 },
      coastal: { min: 65, mid: 120, max: 220 },
      resort: { min: 80, mid: 150, max: 280 },
    },
    areaTransportRanges: {
      metro: { min: 20, mid: 35, max: 55 },
      coastal: { min: 30, mid: 48, max: 72 },
      resort: { min: 40, mid: 62, max: 90 },
    },
    treatmentTripCountAssumptions: {
      "joint-replacement": 8,
      ivf: 6,
      oncology: 10,
      "diabetic-foot": 7,
    },
    treatmentAreaTripCountAssumptions: {
      "joint-replacement": {
        metro: 8,
        coastal: 10,
        resort: 9,
      },
      ivf: {
        metro: 6,
        coastal: 8,
        resort: 8,
      },
      oncology: {
        metro: 10,
        coastal: 11,
      },
      "diabetic-foot": {
        metro: 7,
        resort: 8,
      },
    },
    treatmentAreaAccommodationNightsAssumptions: {
      "joint-replacement": {
        metro: 9,
        coastal: 11,
        resort: 10,
      },
      ivf: {
        metro: 8,
        coastal: 10,
      },
      oncology: {
        metro: 10,
        coastal: 12,
      },
      "diabetic-foot": {
        metro: 8,
        coastal: 9,
      },
    },
    doctorAdjustmentPct: 8,
    hospitalAdjustmentPct: 6,
    travelerAdditionalPct: 65,
    timingMultipliers: {
      asap: 1.05,
      one_month: 1,
      three_months: 0.95,
    },
  },
};

let current: CrmSettings = JSON.parse(JSON.stringify(DEFAULTS)) as CrmSettings;

function clone(s: CrmSettings): CrmSettings {
  return JSON.parse(JSON.stringify(s)) as CrmSettings;
}

export function getCrmSettings(): CrmSettings {
  return clone(current);
}

/** Synchronous read for `ensureSystemTasks` and other pure service code. */
export function getCrmSettingsSync(): CrmSettings {
  return clone(current);
}

/** Fallback trips/routes when a treatment slug has no mapping in {@link EstimateParametersConfig.treatmentTripCountAssumptions}. */
export const DEFAULT_TREATMENT_TRIP_ASSUMPTION = 6;

/**
 * Single source of truth for trips per treatment (CRM transport routes + patient estimate transport/accommodation heuristics).
 */
export function getTreatmentTripCountFromSettings(treatmentSlug: string): number {
  const raw =
    getCrmSettingsSync().estimateParameters.treatmentTripCountAssumptions[treatmentSlug];
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0
    ? Math.floor(raw)
    : DEFAULT_TREATMENT_TRIP_ASSUMPTION;
}

const AREA_ORDER: EstimateAreaZone[] = ["metro", "coastal", "resort"];

/**
 * Recommended vehicle routes for CRM quotations when both treatment slug and geographic area are known.
 * Falls back to {@link getTreatmentTripCountFromSettings} when no zone-specific rule exists.
 */
export function getQuotedTripRecommendation(
  treatmentSlug: string,
  areaZone: EstimateAreaZone,
): number {
  const map =
    getCrmSettingsSync().estimateParameters.treatmentAreaTripCountAssumptions?.[
      treatmentSlug
    ];
  const v = map?.[areaZone];
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.floor(v);
  return getTreatmentTripCountFromSettings(treatmentSlug);
}

export { AREA_ORDER };

/** Nights heuristic shared with patient-facing estimate (accommodation range). */
export function computeDefaultStayNightsFromTrips(tripCount: number): number {
  return Math.max(4, Math.round(tripCount * 0.6));
}

const TIER_EXTRA_NIGHTS: Record<PackageTier, number> = {
  normal: 0,
  silver: 0,
  gold: 1,
  vip: 2,
};

/**
 * Recommended hotel nights for CRM quotations when treatment, package tier and area are known.
 * Uses explicit per–treatment × area nights from settings when set; otherwise derives from trips
 * (zone-aware recommendation) + small tier bump.
 */
export function computeQuotationAccommodationNights(
  treatmentSlug: string,
  packageTier: PackageTier,
  areaZone: EstimateAreaZone = "metro",
): number {
  const nightsMap =
    getCrmSettingsSync().estimateParameters
      .treatmentAreaAccommodationNightsAssumptions?.[treatmentSlug];
  const explicit = nightsMap?.[areaZone];
  if (
    typeof explicit === "number" &&
    Number.isFinite(explicit) &&
    explicit > 0
  ) {
    return Math.min(90, Math.max(3, Math.floor(explicit)));
  }
  const trips = getQuotedTripRecommendation(treatmentSlug, areaZone);
  const base = computeDefaultStayNightsFromTrips(trips);
  return Math.max(3, base + TIER_EXTRA_NIGHTS[packageTier]);
}

export function getDefaultCrmSettings(): CrmSettings {
  return clone(DEFAULTS);
}

export function updateCrmSettings(
  partial: DeepPartial<CrmSettings>,
  options?: { simulateDelay?: boolean },
): Promise<CrmSettings> {
  return (async () => {
    await applyMockDelay(options?.simulateDelay);
    current = deepMerge(clone(current), partial as CrmSettings);
    return getCrmSettings();
  })();
}

export function resetCrmSettingsForTests(): void {
  current = JSON.parse(JSON.stringify(DEFAULTS)) as CrmSettings;
}

export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/** Client-side merge for settings forms (same rules as `updateCrmSettings`). */
export function applyCrmSettingsPatch(
  base: CrmSettings,
  partial: DeepPartial<CrmSettings>,
): CrmSettings {
  return deepMerge(clone(base), partial as CrmSettings);
}

function deepMerge<T extends object>(base: T, patch: DeepPartial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  const p = patch as Record<string, unknown>;
  for (const k of Object.keys(p)) {
    const pv = p[k];
    if (pv === undefined) continue;
    const bv = out[k];
    if (pv && typeof pv === "object" && !Array.isArray(pv) && bv && typeof bv === "object" && !Array.isArray(bv)) {
      out[k] = deepMerge(bv as object, pv as object);
    } else {
      out[k] = pv;
    }
  }
  return out as T;
}

export function isSystemTaskTemplateCompleted(
  lead: Lead,
  templateKey: LeadTaskTemplateKey,
): boolean {
  return lead.tasks.some((t) => t.templateKey === templateKey && t.completed);
}

/**
 * All mandatory document rows on the lead must be uploaded or verified; at least one mandatory row must exist.
 */
export function areMandatoryDocumentsSatisfied(lead: Lead): boolean {
  const mandatory = lead.documents.filter((d) => d.mandatory);
  if (mandatory.length === 0) return false;
  return mandatory.every((d) => d.status === "uploaded" || d.status === "verified");
}

export function canSpawnPrepareQuotation(lead: Lead, settings: CrmSettings = getCrmSettingsSync()): boolean {
  const g = settings.quotationTaskGates;
  if (!g.allowedPrepareQuotationStatuses.includes(lead.status)) return false;
  if (g.requireQualification && !isSystemTaskTemplateCompleted(lead, "lead_qualification")) {
    return false;
  }
  if (g.requireDocuments && !areMandatoryDocumentsSatisfied(lead)) return false;
  if (g.requireInitialConsultation && !isSystemTaskTemplateCompleted(lead, "initial_consultation")) {
    return false;
  }
  return true;
}
