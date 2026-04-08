import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { BackofficeLoginForm } from "./_components/backoffice-login-form";

export default async function BackofficeLoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{t("crmLabel")}</p>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            {t("crmTitle")}
          </h1>
        </div>
        <BackofficeLoginForm />
        <div className="text-center">
          <Link
            href={ROUTES.login}
            prefetch={false}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
