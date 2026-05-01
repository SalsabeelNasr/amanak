/** Pathnames without locale prefix — use with `Link` from `@/i18n/navigation`. */
export const ROUTES = {
  aboutUs: "/about",
  leadEntry: "/estimate",
  bookConsultation: "/contact#book-consultation",
  contactUs: "/contact",
  partners: "/partners",
  treatments: "/treatments",
  hospitals: "/hospitals",
  login: "/login",
  backofficeLogin: "/backoffice-login",
  patientProfile: "/profile",
  patientTreatmentDetails: "/profile/treatment",
  patientOnboarding: "/onboarding",
  crmSettings: "/crm/settings",
  crmInsights: "/crm/insights",
  crmRequests: "/crm/requests",
  crmPatients: "/crm/patients",
  /** @deprecated Use crmRequests */
  crmLeads: "/crm/requests",
  crmDashboard: "/crm/requests",
} as const;
