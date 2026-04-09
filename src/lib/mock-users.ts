import type { MockUser } from "@/types";

/** Seed users for mock auth UIs. Keep this module server-safe (no `"use client"`). */
export const MOCK_USERS: MockUser[] = [
  {
    id: "patient_1",
    name: "أحمد محمد",
    role: "patient",
    email: "ahmed@example.com",
  },
  {
    id: "admin_1",
    name: "Admin Amanak",
    role: "admin",
    email: "admin@amanak.com",
  },
];
