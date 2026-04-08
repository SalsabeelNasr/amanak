import { getTranslations } from "next-intl/server";

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
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">{t("title")}</h2>
          <p className="text-pretty text-lg text-muted-foreground leading-relaxed">{t("lead")}</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {bullets.map((b) => (
            <div key={b.bodyKey} className="group relative space-y-4 rounded-2xl border border-border/60 bg-card/50 p-6 sm:p-8">
              <div className="h-1 w-12 bg-primary/20 transition-all group-hover:w-full group-hover:bg-primary" />
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">{t(b.titleKey)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t(b.bodyKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
