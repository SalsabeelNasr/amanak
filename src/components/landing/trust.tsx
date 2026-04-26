import { getTranslations } from "next-intl/server";
import { Quote } from "lucide-react";

const TRUST_ITEMS = {
  "1": {
    quote: "items.1.quote",
    attribution: "items.1.attribution",
    treatment: "items.1.treatment",
  },
  "2": {
    quote: "items.2.quote",
    attribution: "items.2.attribution",
    treatment: "items.2.treatment",
  },
  "3": {
    quote: "items.3.quote",
    attribution: "items.3.attribution",
    treatment: "items.3.treatment",
  },
} as const;

type TestimonialId = keyof typeof TRUST_ITEMS;

export async function Trust() {
  const t = await getTranslations("landing.trust");

  const testimonialIds: TestimonialId[] = ["1", "2", "3"];

  return (
    <section className="bg-background py-20 sm:py-24 border-t border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
            {t("stats")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonialIds.map((id) => {
            const keys = TRUST_ITEMS[id];
            return (
              <div
                key={id}
                className="relative flex flex-col items-center text-center space-y-4 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex justify-center">
                  <Quote className="size-6 sm:size-8 text-primary/20" aria-hidden />
                </div>
                <blockquote className="flex-1 text-base sm:text-lg font-medium leading-relaxed text-foreground italic">
                  {t(keys.quote)}
                </blockquote>
                <div className="space-y-1">
                  <cite className="not-italic text-sm sm:text-base font-bold text-foreground block">
                    {t(keys.attribution)}
                  </cite>
                  <span className="text-xs sm:text-sm font-medium text-primary bg-primary/5 px-3 py-1 rounded-full">
                    {t(keys.treatment)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
