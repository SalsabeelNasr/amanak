import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listTreatments } from "@/lib/api/treatments";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  ] as const;

  const featuredItems = featuredPrograms
    .map((program) => {
      const treatment = items.find((item) => item.slug === program.slug);
      if (!treatment) return null;
      /** Files in `public/treatments/<slug>.jpg` — load without `/_next/image` to avoid stale optimizer cache when files are replaced. */
      const imageSrc = `/treatments/${treatment.slug}.jpg`;
      return {
        ...program,
        treatment,
        imageSrc,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <section className="border-t border-border/40 bg-muted py-20 sm:py-24">
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredItems.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
                <Image
                  src={item.imageSrc}
                  alt={t(`items.${item.id}.title`)}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                <div className="absolute bottom-3 start-4 end-4">
                  <h3 className="text-balance text-lg font-bold text-white drop-shadow-sm sm:text-xl">
                    {t(`items.${item.id}.title`)}
                  </h3>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <p className="grow text-pretty text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {t(`items.${item.id}.description`)}
                </p>
                <Link
                  href={`${ROUTES.treatments}/${item.treatment.slug}`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "mt-5 w-full rounded-full font-bold shadow-sm transition-shadow group-hover:shadow-md",
                  )}
                  prefetch={false}
                >
                  {t("learnMore")}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            href={ROUTES.treatments}
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "rounded-full px-8 font-bold",
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
