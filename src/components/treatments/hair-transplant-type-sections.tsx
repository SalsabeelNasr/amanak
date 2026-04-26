import type { HairTransplantVariant } from "@/lib/api/hair-transplant-variants";

function RichText({ text }: { text: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="leading-relaxed text-muted-foreground text-lg">
          {p}
        </p>
      ))}
    </div>
  );
}

type Props = {
  heading: string;
  variants: readonly HairTransplantVariant[];
  labels: (key: string) => string;
  priceLabel: string;
};

export function HairTransplantTypeSections({ heading, variants, labels, priceLabel }: Props) {
  return (
    <section className="space-y-10 border-t border-border pt-12">
      <h2 className="text-2xl font-bold text-foreground sm:text-3xl">{heading}</h2>
      <div className="space-y-14">
        {variants.map((v) => (
          <article key={v.id} className="space-y-4">
            <h3 className="text-xl font-bold text-foreground sm:text-2xl">{labels(v.titleKey)}</h3>
            <p className="text-lg leading-relaxed text-muted-foreground">{labels(v.descriptionKey)}</p>
            <RichText text={labels(v.bodyKey)} />
            <p className="text-sm font-medium text-foreground">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary/80">
                {priceLabel}
              </span>{" "}
              <span className="text-lg font-bold">${v.priceUSD.toLocaleString()}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
