import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";

export async function PainPoints() {
  const t = await getTranslations("landing.painPoints");

  const rows = [
    { p: "row1p" as const, s: "row1s" as const },
    { p: "row2p" as const, s: "row2s" as const },
    { p: "row3p" as const, s: "row3s" as const },
    { p: "row4p" as const, s: "row4s" as const },
  ];

  return (
    <section className="bg-white py-24 sm:py-32 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
        <div className="mx-auto max-w-3xl space-y-6 text-center mb-16">
          <h2 className="amanak-marketing-section-title tracking-tight">
            {t("title")}
          </h2>
          <div className="h-1.5 w-20 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {rows.map((row, index) => (
            <div 
              key={row.p} 
              className="group relative flex flex-col sm:flex-row items-start gap-6 p-8 rounded-2xl bg-white border border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20"
            >
              <div className="flex-shrink-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                  <ShieldCheck className="h-7 w-7" />
                </div>
              </div>

              <div className="flex-grow space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {t(row.p)}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(row.s)}
                  </p>
                </div>
              </div>

              {/* Subtle index indicator */}
              <div className="absolute top-4 right-4 text-4xl font-black text-primary/5 select-none transition-colors group-hover:text-primary/10">
                0{index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
