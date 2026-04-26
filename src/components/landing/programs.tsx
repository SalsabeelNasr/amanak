import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listTreatments } from "@/lib/api/treatments";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

export async function Programs() {
  const [t, tTreatments, items] = await Promise.all([
    getTranslations("landing.programs"),
    getTranslations("treatments"),
    listTreatments(),
  ]);

  const featuredPrograms = [
    { id: "ivf", slug: "ivf", image: "/treatments/ivf.jpg" },
    { id: "dental", slug: "dental", image: "/treatments/dental.jpg" },
    { id: "eyeSurgery", slug: "eye-surgery", image: "/treatments/eye-surgery.jpg" },
    { id: "bariatric", slug: "bariatric", image: "/treatments/bariatric.jpg" },
    { id: "cosmetic", slug: "cosmetic", image: "/treatments/cosmetic.jpg" },
    { id: "jointReplacement", slug: "joint-replacement", image: "/treatments/joint-replacement.jpg" },
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
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuredItems.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-border/10 bg-card transition-all hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={item.image}
                  alt={t(`items.${item.id}.title`)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-4 ltr:left-4 rtl:right-4">
                  <h3 className="text-xl font-bold text-white">
                    {t(`items.${item.id}.title`)}
                  </h3>
                </div>
              </div>

              <div className="flex grow flex-col p-6 sm:p-8">
                <p className="grow text-sm text-muted-foreground mb-6 line-clamp-3">
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
