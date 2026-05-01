import { getCrmSettings } from "@/lib/api/crm-settings";
import { getTranslations } from "next-intl/server";
import { CrmSettingsForm } from "./_components/crm-settings-form";

export default async function CrmSettingsPage() {
  const t = await getTranslations("crm");
  const initial = getCrmSettings();

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8">
      <header className="border-b border-border/40 pb-4">
        <h1 className="amanak-app-page-title">{t("settingsPageTitle")}</h1>
      </header>
      <CrmSettingsForm initial={initial} />
    </div>
  );
}
