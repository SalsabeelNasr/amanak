import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function CrmDashboardRedirect() {
  redirect(ROUTES.crmLeads);
}
