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
      className={cn("border-t border-border/40 bg-muted/30 py-16 sm:py-20", className)}
      aria-labelledby="supervision-banner-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-10 text-center rtl:text-center">
          <h2
            id="supervision-banner-heading"
            className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
          >
            {t("supervisionIntro")}
          </h2>

          <div className="grid grid-cols-1 items-start justify-items-center gap-14 md:grid-cols-2 md:gap-12 lg:gap-16">
            <div className="flex w-full max-w-lg flex-col items-center gap-5">
              <div className="relative mx-auto h-44 w-full max-w-[280px] sm:h-48 sm:max-w-[300px] md:h-52 md:max-w-[320px]">
                <Image
                  src="/footer/ministry-of-health-population-egypt.png"
                  alt={t("supervisionMinistryAlt")}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 280px, 320px"
                />
              </div>
              <p className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                {t("supervisionMinistryCaption")}
              </p>
            </div>

            <div className="flex w-full max-w-lg flex-col items-center gap-5">
              <div className="relative mx-auto h-44 w-full max-w-[280px] sm:h-48 sm:max-w-[300px] md:h-52 md:max-w-[320px]">
                <Image
                  src="/footer/national-council-health-tourism.png"
                  alt={t("supervisionCouncilAlt")}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 280px, 320px"
                />
              </div>
              <p className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                {t("supervisionCouncilCaption")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
