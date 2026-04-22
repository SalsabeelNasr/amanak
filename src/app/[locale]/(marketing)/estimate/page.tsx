import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function EstimatePlaceholderPage() {
  const t = await getTranslations("estimate");

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">
        {t("title")}
      </p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {t("comingSoon")}
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">{t("comingSoonBody")}</p>
      <Link
        href={ROUTES.contactUs}
        className={cn(buttonVariants({ size: "lg" }), "mt-8 rounded-full")}
        prefetch={false}
      >
        {t("goInquiry")}
      </Link>
    </div>
  );
}
