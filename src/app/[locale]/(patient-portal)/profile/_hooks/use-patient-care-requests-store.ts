"use client";

import { useSyncExternalStore } from "react";
import {
  PATIENT_CARE_REQUESTS_EVENT,
  listPatientCareRequests,
} from "@/lib/patient-care-requests";
import type { PatientCareRequest } from "@/types";

const EMPTY: PatientCareRequest[] = [];

function subscribe(onStoreChange: () => void) {
  const onCustom = () => onStoreChange();
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key?.includes("amanak_patient_care_requests")) onStoreChange();
  };
  window.addEventListener(PATIENT_CARE_REQUESTS_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(PATIENT_CARE_REQUESTS_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): PatientCareRequest[] {
  return listPatientCareRequests();
}

function getServerSnapshot(): PatientCareRequest[] {
  return EMPTY;
}

export function usePatientCareRequestsFromStorage(): PatientCareRequest[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
