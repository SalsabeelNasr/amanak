import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { wordmarkFont } from "@/lib/wordmark-font";
import { cn } from "@/lib/utils";
import { PatientLoginForm } from "./_components/patient-login-form";

export default async function PatientLoginPage() {
  const t = await getTranslations("auth");

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12"
      data-amanak-app-ui
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <span
            data-amanak-wordmark
            className={cn(
              wordmarkFont.variable,
              "font-wordmark text-4xl font-black tracking-tight text-brand-wordmark",
            )}
          >
            Amanak
          </span>
          <h1 className="mt-6 text-2xl font-semibold text-foreground">
            {t("portalWelcome")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("portalSubtitle")}
          </p>
        </div>
        <PatientLoginForm />
        <p className="text-center text-xs text-muted-foreground/80">
          {t("mockNote")}
        </p>
      </div>

      <footer className="mt-16 text-center">
        <Link
          href={ROUTES.backofficeLogin}
          prefetch={false}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground hover:underline"
        >
          {t("backofficeLogin")}
        </Link>
      </footer>
    </div>
  );
}
