import { getTranslations } from "next-intl/server";

export async function PainPoints() {
  const t = await getTranslations("landing.painPoints");

  const rows = [
    { p: "row1p" as const, s: "row1s" as const },
    { p: "row2p" as const, s: "row2s" as const },
    { p: "row3p" as const, s: "row3s" as const },
    { p: "row4p" as const, s: "row4s" as const },
  ];

  return (
    <section className="bg-background py-20 sm:py-24 border-t border-border/40">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-6">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <div className="space-y-8">
            {rows.map((row) => (
              <div key={row.p} className="group flex gap-6">
                <div className="flex-none pt-1">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-foreground leading-tight">{t(row.p)}</p>
                  <p className="text-muted-foreground leading-relaxed">{t(row.s)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
