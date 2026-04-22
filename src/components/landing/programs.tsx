import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listTreatments } from "@/lib/api/treatments";
import type { TreatmentCategory } from "@/types";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, ChevronLeft } from "lucide-react";

export async function Programs() {
  const [t, tTreatments, items, tGlobal] = await Promise.all([
    getTranslations("landing.programs"),
    getTranslations("treatments"),
    listTreatments(),
    getTranslations(),
  ]);

  const categoryOrder: TreatmentCategory[] = [
    "general",
    "ortho",
    "cosmetic",
    "dental",
    "specialized",
  ];

  const categories = Object.fromEntries(
    categoryOrder.map((key) => [key, items.filter((item) => item.category === key)]),
  ) as Record<TreatmentCategory, typeof items>;

  const categoryLabels = {
    general: tTreatments("categories.general"),
    ortho: tTreatments("categories.ortho"),
    cosmetic: tTreatments("categories.cosmetic"),
    dental: tTreatments("categories.dental"),
    specialized: tTreatments("categories.specialized"),
  };

  return (
    <section className="bg-primary py-20 sm:py-24 border-t border-primary/20">
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
          {categoryOrder.map((catKey) => {
            const catItems = categories[catKey];
            if (catItems.length === 0) return null;

            return (
              <div
                key={catKey}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all hover:shadow-xl hover:border-primary/20 sm:p-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {catKey === "general" && (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    )}
                    {catKey === "ortho" && (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {catKey === "cosmetic" && (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {catKey === "dental" && (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3c-1.5 0-2.8.8-3.5 2-.4.8-.5 1.7-.5 2.5 0 1.2-.3 2.2-.8 3.1-.5.9-1.2 1.6-2 2.1-.8.5-1.7.8-2.7.8v8h16v-8c-1 0-1.9-.3-2.7-.8-.8-.5-1.5-1.2-2-2.1-.5-.9-.8-1.9-.8-3.1 0-.8-.1-1.7-.5-2.5-.7-1.2-2-2-3.5-2z"
                        />
                      </svg>
                    )}
                    {catKey === "specialized" && <Activity className="h-6 w-6" aria-hidden />}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground leading-tight">
                    {categoryLabels[catKey]}
                  </h3>
                </div>

                <div className="grow space-y-3 mb-8">
                  {catItems.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      href={`${ROUTES.treatments}/${item.slug}`}
                      className="group/item flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-secondary/50"
                    >
                      <span className="text-sm font-medium text-muted-foreground group-hover/item:text-primary transition-colors">
                        {tGlobal(item.titleKey)}
                      </span>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground/40 group-hover/item:text-primary transition-all group-hover/item:translate-x-[-4px]" />
                    </Link>
                  ))}
                  {catItems.length > 4 && (
                    <p className="text-xs text-muted-foreground/60 px-3 pt-2">
                      +{catItems.length - 4} {tTreatments("viewAll")}
                    </p>
                  )}
                </div>

                <Link
                  href={ROUTES.treatments}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full rounded-full font-bold shadow-sm group-hover:shadow-md transition-all"
                  )}
                  prefetch={false}
                >
                  {tTreatments("viewAll")}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
