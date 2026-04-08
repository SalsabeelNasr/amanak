import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function EstimatePlaceholderPage() {
  const t = await getTranslations("estimate");

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
      <p className="text-lg text-muted-foreground">{t("lead")}</p>
      <Link
        href={ROUTES.inquiry}
        className={cn(buttonVariants({ size: "lg" }))}
        prefetch={false}
      >
        {t("goInquiry")}
      </Link>
    </div>
  );
}
