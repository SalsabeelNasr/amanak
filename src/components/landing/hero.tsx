import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export async function LandingHero() {
  const t = await getTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden bg-background pt-16 pb-24 sm:pt-24 sm:pb-32">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[50%] top-0 h-[1000px] w-[1000px] -translate-x-[50%] rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="flex flex-col items-start text-start space-y-8">
            <div className="space-y-4 max-w-2xl">
              <h1 className="amanak-marketing-hero-title whitespace-pre-line">{t("title")}</h1>
              <p className="amanak-marketing-hero-subtitle">{t("subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={ROUTES.bookConsultation}
                className={cn(buttonVariants({ size: "lg" }), "min-h-12 px-8 text-base rounded-full shadow-lg shadow-primary/20 hover:shadow-xl transition-all")}
                prefetch={false}
              >
                {t("cta")}
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-muted shadow-2xl">
            <Image
              src="/landing/hero-waterfront.png"
              alt={t("imageAlt")}
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
