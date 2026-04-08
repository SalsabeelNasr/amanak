import { getTranslations } from "next-intl/server";

export async function Process() {
  const t = await getTranslations("landing.process");

  const steps = [
    { title: "step1Title" as const, body: "step1" as const },
    { title: "step2Title" as const, body: "step2" as const },
    { title: "step3Title" as const, body: "step3" as const },
    { title: "step4Title" as const, body: "step4" as const },
  ];

  return (
    <section className="bg-secondary/30 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl space-y-12 px-4 sm:px-6">
        <div className="text-center space-y-4">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            {t("title")}
          </h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-12">
          {steps.map((step, i) => (
            <div key={step.body} className="relative space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {i + 1}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">{t(step.title)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t(step.body)}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 ltr:left-[calc(3rem+1rem)] ltr:right-[-1rem] rtl:right-[calc(3rem+1rem)] rtl:left-[-1rem] h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
