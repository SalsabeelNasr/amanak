import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

const IMAGES = {
  jtny: "/landing/jtny-hero.png",
  arrw: "/landing/arrw-hero.png",
  privateMeet: "/landing/private-transport-hero.png",
} as const;

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 list-none space-y-2 ps-0">
      {items.map((item) => (
        <li key={item} className="relative ps-5 text-sm text-muted-foreground leading-relaxed">
          <span className="absolute start-0 top-2 h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

function PartnerCard({
  brand,
  tagline,
  whatItIs,
  bullets,
  imageSrc,
  imageAlt,
  className,
}: {
  brand: string;
  tagline: string;
  whatItIs: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 bg-muted">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 40vw, 100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 start-4 end-4">
          <p className="text-lg font-bold text-white drop-shadow-sm">{brand}</p>
          <p className="text-sm font-medium text-white/90">{tagline}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-8">
        <p className="text-sm text-muted-foreground leading-relaxed">{whatItIs}</p>
        <BulletList items={bullets} />
      </div>
    </article>
  );
}

export async function TransportationPartners() {
  const t = await getTranslations("landing.transportation");
  const sectionId = "transportation-partners-heading";

  return (
    <section className="bg-muted/30 py-20 sm:py-24 border-t border-border/40" aria-labelledby={sectionId}>
      <div className="mx-auto max-w-6xl space-y-14 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 id={sectionId} className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-pretty text-lg text-muted-foreground leading-relaxed">{t("intro")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <PartnerCard
            brand={t("jtnyBrand")}
            tagline={t("jtnyTagline")}
            whatItIs={t("jtnyWhat")}
            bullets={[t("jtnyB1"), t("jtnyB2"), t("jtnyB3"), t("jtnyB4")]}
            imageSrc={IMAGES.jtny}
            imageAlt={t("jtnyImageAlt")}
          />
          <PartnerCard
            brand={t("arrwBrand")}
            tagline={t("arrwTagline")}
            whatItIs={t("arrwWhat")}
            bullets={[t("arrwB1"), t("arrwB2"), t("arrwB3")]}
            imageSrc={IMAGES.arrw}
            imageAlt={t("arrwImageAlt")}
          />
        </div>

        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="relative min-h-[260px] bg-muted lg:min-h-[360px]">
              <Image
                src={IMAGES.privateMeet}
                alt={t("privateImageAltMeet")}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="flex flex-col justify-center space-y-6 p-8 sm:p-10">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-foreground">{t("privateTitle")}</h3>
                <p className="text-muted-foreground leading-relaxed">{t("privateLead")}</p>
              </div>
              <div className="space-y-5">
                <div>
                  <h4 className="text-base font-bold text-foreground">{t("privateAirportTitle")}</h4>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t("privateAirport")}</p>
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{t("privateVehicleTitle")}</h4>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t("privateVehicle")}</p>
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{t("private247Title")}</h4>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t("private247")}</p>
                </div>
              </div>
              <p className="text-pretty border-t border-border pt-6 text-sm font-medium text-foreground leading-relaxed">
                {t("privateClosing")}
              </p>
              <p className="text-pretty pt-4 text-sm text-muted-foreground leading-relaxed">
                {t("privateImageCaption")}
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
