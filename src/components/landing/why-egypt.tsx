import { getTranslations } from "next-intl/server";
import { Quote } from "lucide-react";

export async function WhyEgypt() {
  const t = await getTranslations("landing.whyEgypt");

  const bullets = [
    { titleKey: "bullet1Title" as const, bodyKey: "bullet1" as const },
    { titleKey: "bullet2Title" as const, bodyKey: "bullet2" as const },
    { titleKey: "bullet3Title" as const, bodyKey: "bullet3" as const },
    { titleKey: "bullet4Title" as const, bodyKey: "bullet4" as const },
  ];

  return (
    <section className="bg-background py-20 sm:py-24 border-t border-border/40">
      <div className="mx-auto max-w-6xl space-y-16 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="amanak-marketing-section-title">{t("title")}</h2>
          <div className="relative mt-5 rounded-2xl border border-primary/10 bg-primary/[0.02] px-5 py-5 sm:px-6 sm:py-6">
            <Quote className="absolute -top-3 left-1/2 size-5 -translate-x-1/2 text-primary/20 bg-background px-1" aria-hidden />
            <p className="text-pretty text-base font-medium italic leading-relaxed text-foreground/90 sm:text-lg">
              {t("lead")}
            </p>
          </div>
        </div>
        <ol className="m-0 grid list-none gap-8 p-0 sm:grid-cols-2">
          {bullets.map((b, index) => (
            <li key={b.bodyKey} className="group relative rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
              <div className="flex gap-4 sm:gap-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-bold tabular-nums text-primary sm:h-10 sm:w-10 sm:text-base">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="h-1 w-12 bg-primary/20 transition-all group-hover:w-full group-hover:bg-primary" />
                  <div className="space-y-2">
                    <h3 className="amanak-marketing-card-title">{t(b.titleKey)}</h3>
                    <p className="text-muted-foreground leading-relaxed">{t(b.bodyKey)}</p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
