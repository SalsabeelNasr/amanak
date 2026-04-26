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
  href,
}: {
  brand: string;
  tagline: string;
  whatItIs: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  className?: string;
  href?: string;
}) {
  const content = (
    <article
      className={cn(
        "flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md",
        href && "hover:border-primary/30",
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full shrink-0 bg-muted">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover object-bottom"
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

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">
        {content}
      </a>
    );
  }

  return content;
}

type TransportationPartnersProps = {
  /** When true, render inside a parent section (e.g. Partners “Other partners”) with h3 for the block title. */
  embedded?: boolean;
};

export async function TransportationPartners({ embedded = false }: TransportationPartnersProps = {}) {
  const t = await getTranslations("partners.transportation");
  const sectionId = "transportation-partners-heading";
  const TitleTag = embedded ? "h3" : "h2";
  const PrivateTitleTag = embedded ? "h4" : "h3";
  const PrivateSubTitleTag = embedded ? "h5" : "h4";
  const outerClassName = embedded
    ? "space-y-14"
    : "bg-muted/30 py-20 sm:py-24 border-t border-border/40";
  const innerPadding = embedded ? "" : "mx-auto max-w-6xl space-y-14 px-4 sm:px-6";

  const body = (
    <>
      {(!embedded || t("intro")) && (
        <div className={cn("mx-auto max-w-3xl space-y-4 text-center", embedded && "px-0")}>
          {!embedded && (
            <TitleTag id={sectionId} className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("title")}
            </TitleTag>
          )}
          <p className="text-pretty text-lg text-muted-foreground leading-relaxed">{t("intro")}</p>
        </div>
      )}

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <PartnerCard
            brand={t("jtnyBrand")}
            tagline={t("jtnyTagline")}
            whatItIs={t("jtnyWhat")}
            bullets={[t("jtnyB1"), t("jtnyB2"), t("jtnyB3"), t("jtnyB4")]}
            imageSrc={IMAGES.jtny}
            imageAlt={t("jtnyImageAlt")}
            href="https://jtnyeg.com"
          />
          <PartnerCard
            brand={t("arrwBrand")}
            tagline={t("arrwTagline")}
            whatItIs={t("arrwWhat")}
            bullets={[t("arrwB1"), t("arrwB2"), t("arrwB3")]}
            imageSrc={IMAGES.arrw}
            imageAlt={t("arrwImageAlt")}
            href="https://mwm.ai/apps/arrw/6744344347"
          />
        </div>

        <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid gap-0 lg:grid-cols-2">
            <div className="relative min-h-[260px] bg-muted lg:min-h-[360px]">
              <Image
                src={IMAGES.privateMeet}
                alt={t("privateImageAltMeet")}
                fill
                className="object-cover object-bottom"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
            <div className="flex flex-col justify-center space-y-6 p-8 sm:p-10">
              <div className="space-y-2">
                <PrivateTitleTag className="text-2xl font-bold text-foreground">{t("privateTitle")}</PrivateTitleTag>
                <p className="text-muted-foreground leading-relaxed">{t("privateLead")}</p>
              </div>
              <div className="space-y-5">
                <div>
                  <PrivateSubTitleTag className="text-base font-bold text-foreground">{t("privateAirportTitle")}</PrivateSubTitleTag>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t("privateAirport")}</p>
                </div>
                <div>
                  <PrivateSubTitleTag className="text-base font-bold text-foreground">{t("privateVehicleTitle")}</PrivateSubTitleTag>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t("privateVehicle")}</p>
                </div>
                <div>
                  <PrivateSubTitleTag className="text-base font-bold text-foreground">{t("private247Title")}</PrivateSubTitleTag>
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
    </>
  );

  if (embedded) {
    return <div className={outerClassName}>{body}</div>;
  }

  return (
    <section className={outerClassName} aria-labelledby={sectionId}>
      <div className={innerPadding}>{body}</div>
    </section>
  );
}
