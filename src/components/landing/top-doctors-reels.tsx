import { getTranslations } from "next-intl/server";
import { DOCTOR_REEL_EMBEDS } from "@/lib/landing/doctor-reel-embeds";
import { InstagramReelsCarousel } from "@/components/landing/instagram-reels-carousel";

export async function TopDoctorsReels() {
  const t = await getTranslations("landing.topDoctorsReels");

  return (
    <section className="border-y border-border/80 bg-background py-14 sm:py-16">
      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3 text-center md:mx-0 md:text-start">
          <h2 className="text-balance text-2xl font-semibold text-foreground sm:text-3xl">
            {t("title")}
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">{t("lead")}</p>
        </div>
        <InstagramReelsCarousel items={DOCTOR_REEL_EMBEDS} />
      </div>
    </section>
  );
}
