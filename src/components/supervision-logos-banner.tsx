import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

type SupervisionLogosBannerProps = {
  className?: string;
};

export async function SupervisionLogosBanner({ className }: SupervisionLogosBannerProps) {
  const t = await getTranslations("footer");

  return (
    <section
      className={cn("border-t border-border/40 bg-muted/30 py-8 sm:py-10", className)}
      aria-labelledby="supervision-banner-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6 text-center rtl:text-center">
          <h2
            id="supervision-banner-heading"
            className="text-balance text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl"
          >
            {t("supervisionIntro")}
          </h2>

          <div className="grid grid-cols-1 items-start justify-items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
            <div className="flex w-full max-w-lg flex-col items-center gap-3">
              <div className="relative mx-auto h-24 w-full max-w-[180px] sm:h-28 sm:max-w-[200px] md:h-32 md:max-w-[220px]">
                <Image
                  src="/footer/ministry-of-health-population-egypt.png"
                  alt={t("supervisionMinistryAlt")}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 180px, 220px"
                />
              </div>
              <p className="text-balance text-sm font-semibold leading-snug text-foreground sm:text-base">
                {t("supervisionMinistryCaption")}
              </p>
            </div>

            <div className="flex w-full max-w-lg flex-col items-center gap-3">
              <div className="relative mx-auto h-24 w-full max-w-[180px] sm:h-28 sm:max-w-[200px] md:h-32 md:max-w-[220px]">
                <Image
                  src="/footer/national-council-health-tourism.png"
                  alt={t("supervisionCouncilAlt")}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 180px, 220px"
                />
              </div>
              <p className="text-balance text-sm font-semibold leading-snug text-foreground sm:text-base">
                {t("supervisionCouncilCaption")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
