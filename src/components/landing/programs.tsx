import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listTreatments } from "@/lib/api/treatments";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export async function Programs() {
  const [t, tTreatments, items] = await Promise.all([
    getTranslations("landing.programs"),
    getTranslations("treatments"),
    listTreatments(),
  ]);

  const featuredPrograms = [
    { id: "ivf", slug: "ivf" },
    { id: "dental", slug: "dental" },
    { id: "eyeSurgery", slug: "eye-surgery" },
    { id: "bariatric", slug: "bariatric" },
    { id: "cosmetic", slug: "cosmetic" },
    { id: "jointReplacement", slug: "joint-replacement" },
  ];

  const featuredItems = featuredPrograms
    .map((program) => {
      const treatment = items.find((item) => item.slug === program.slug);
      if (!treatment) return null;
      return {
        ...program,
        treatment,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section className="bg-primary py-20 sm:py-24 border-t border-primary/20">
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-balance text-primary-foreground/80 sm:text-lg">{t("lead")}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all hover:shadow-xl hover:border-primary/20 sm:p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-2xl font-bold text-foreground leading-tight">
                  {t(`items.${item.id}.title`)}
                </h3>
              </div>

              <p className="grow text-sm text-muted-foreground mb-8">
                {t(`items.${item.id}.description`)}
              </p>

              <Link
                href={`${ROUTES.treatments}/${item.treatment.slug}`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full rounded-full font-bold shadow-sm group-hover:shadow-md transition-all",
                )}
                prefetch={false}
              >
                {t("learnMore")}
              </Link>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href={ROUTES.treatments}
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "rounded-full font-bold px-8",
            )}
            prefetch={false}
          >
            {tTreatments("viewAll")}
          </Link>
        </div>
      </div>
    </section>
  );
}
