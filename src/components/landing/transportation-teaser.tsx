import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

const IMAGES = {
  jtny: "/landing/jtny-hero.png",
  arrw: "/landing/arrw-hero.png",
  privateMeet: "/landing/private-transport-hero.png",
} as const;

type TeaserCardKey = "jtny" | "arrw" | "private";

const CARD_ORDER: TeaserCardKey[] = ["jtny", "arrw", "private"];

function TeaserCard({
  imageSrc,
  imageAlt,
  brand,
  blurb,
  className,
}: {
  imageSrc: string;
  imageAlt: string;
  brand: string;
  blurb: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full shrink-0 bg-muted">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover object-bottom"
          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        <div className="absolute bottom-3 start-3 end-3">
          <p className="text-base font-bold text-white drop-shadow-sm">{brand}</p>
        </div>
      </div>
      <p className="p-4 text-sm text-muted-foreground leading-relaxed">{blurb}</p>
    </article>
  );
}

export async function TransportationTeaser() {
  const t = await getTranslations("landing.transportationTeaser");
  const sectionId = "transportation-teaser-heading";

  const cards: Record<
    TeaserCardKey,
    { imageSrc: string; imageAlt: string; brand: string; blurb: string }
  > = {
    jtny: {
      imageSrc: IMAGES.jtny,
      imageAlt: t("jtnyImageAlt"),
      brand: t("jtnyBrand"),
      blurb: t("jtnyBlurb"),
    },
    arrw: {
      imageSrc: IMAGES.arrw,
      imageAlt: t("arrwImageAlt"),
      brand: t("arrwBrand"),
      blurb: t("arrwBlurb"),
    },
    private: {
      imageSrc: IMAGES.privateMeet,
      imageAlt: t("privateImageAlt"),
      brand: t("privateBrand"),
      blurb: t("privateBlurb"),
    },
  };

  return (
    <section
      className="border-t border-border/40 bg-muted/30 py-16 sm:py-20"
      aria-labelledby={sectionId}
    >
      <div className="mx-auto max-w-6xl space-y-10 px-4 sm:px-6">
        <div className="max-w-3xl space-y-3 text-start">
          <h2
            id={sectionId}
            className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="text-pretty text-lg text-muted-foreground leading-relaxed">{t("lead")}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARD_ORDER.map((key) => {
            const c = cards[key];
            return (
              <TeaserCard
                key={key}
                imageSrc={c.imageSrc}
                imageAlt={c.imageAlt}
                brand={c.brand}
                blurb={c.blurb}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
