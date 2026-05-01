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
    id: "p_acc",
    name: "Noor Saleh",
    role: "patient",
    email: "noor@example.com",
  },
  {
    id: "p_book",
    name: "Sara Ali",
    role: "patient",
    email: "sara@example.com",
  },
  {
    id: "p_arr",
    name: "Omar Khaled",
    role: "patient",
    email: "omar@example.com",
  },
  {
    id: "p_tr",
    name: "Lina Hassan",
    role: "patient",
    email: "lina@example.com",
  },
  {
    id: "admin_1",
    name: "Admin Amanak",
    role: "admin",
    email: "admin@amanak.com",
  },
];
