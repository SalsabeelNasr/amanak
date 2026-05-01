import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

/** @deprecated — quotations are created from the lead detail Quotes tab. */
export default async function QuotationCreationRedirectPage() {
  const locale = await getLocale();
  redirect({ href: ROUTES.crmLeads, locale });
}
