import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tAuth = await getTranslations("auth");

  return (
    <footer className="border-t border-border bg-card pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] text-sm text-muted-foreground">
      <div className="mx-auto max-w-6xl space-y-2 px-4 sm:px-6">
        <p className="font-medium text-foreground">{t("tagline")}</p>
        <p>© {new Date().getFullYear()} {t("rights")}</p>
        <p>
          <Link
            href={ROUTES.backofficeLogin}
            prefetch={false}
            className="text-xs text-muted-foreground/60 hover:text-foreground hover:underline"
          >
            {tAuth("backofficeLogin")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
