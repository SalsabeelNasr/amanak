import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tAuth = await getTranslations("auth");

  return (
    <footer className="border-t border-border bg-card pt-10 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] text-sm text-muted-foreground">
      {/* Grid mirrors in RTL: tagline column moves inline-end, links inline-start (mirror of LTR). */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
        <div className="space-y-1">
          <p className="font-medium text-foreground">{t("tagline")}</p>
          <p>© {new Date().getFullYear()} {t("rights")}</p>
        </div>
        <div className="flex flex-col gap-2 self-start justify-self-start sm:flex-row sm:items-center sm:gap-3 sm:self-auto sm:justify-self-end">
          <Link
            href={ROUTES.contactUs}
            prefetch={false}
            className="rounded-md px-1 py-1 font-medium text-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            {tNav("contactUs")}
          </Link>
          <Link
            href={ROUTES.backofficeLogin}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {tAuth("backofficeLogin")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
