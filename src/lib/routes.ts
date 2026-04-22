/** Pathnames without locale prefix — use with `Link` from `@/i18n/navigation`. */
export const ROUTES = {
  leadEntry: "/estimate",
  bookConsultation: "/contact#book-consultation",
  contactUs: "/contact",
  partners: "/partners",
  treatments: "/treatments",
  hospitals: "/hospitals",
  login: "/login",
  backofficeLogin: "/backoffice-login",
  patientProfile: "/profile",
  crmDashboard: "/crm/dashboard",
  crmInsights: "/crm/insights",
  crmLeads: "/crm/leads",
} as const;
