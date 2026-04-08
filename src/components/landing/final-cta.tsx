import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function FinalCta() {
  const t = await getTranslations("landing.finalCta");

  return (
    <section className="bg-primary py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="space-y-8">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-primary-foreground/80 sm:text-xl">
            {t("body")}
          </p>
          <div className="pt-4">
            <Link
              href={ROUTES.bookConsultation}
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "min-h-12 px-10 text-base rounded-full shadow-xl hover:shadow-2xl transition-all"
              )}
              prefetch={false}
            >
              {t("button")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
