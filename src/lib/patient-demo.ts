import { MOCK_USERS } from "@/lib/mock-users";
import type { MockUser } from "@/types";

const DEFAULT_LEAD_BY_PATIENT_ID: Record<string, string> = {
  patient_1: "lead_1",
  p_acc: "lead_7",
  p_book: "lead_8",
  p_arr: "lead_9",
  p_tr: "lead_10",
};

export type DemoPatientOption = {
  user: MockUser;
  patientId: string;
  defaultLeadId: string;
};

export function getPatientIdFromParam(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getDefaultRequestIdForPatient(patientId: string | undefined): string | undefined {
  if (!patientId) return undefined;
  return DEFAULT_LEAD_BY_PATIENT_ID[patientId];
}

/** @deprecated Use {@link getDefaultRequestIdForPatient} */
export function getDefaultLeadIdForPatient(patientId: string | undefined): string | undefined {
  return getDefaultRequestIdForPatient(patientId);
}

export function listDemoPatientOptions(): DemoPatientOption[] {
  return MOCK_USERS.filter((u) => u.role === "patient")
    .map((user) => {
      const defaultLeadId = DEFAULT_LEAD_BY_PATIENT_ID[user.id];
      if (!defaultLeadId) return null;
      return {
        user,
        patientId: user.id,
        defaultLeadId,
      } satisfies DemoPatientOption;
    })
    .filter((row): row is DemoPatientOption => row !== null);
}
