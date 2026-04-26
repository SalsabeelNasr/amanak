import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MapPin, Home } from "lucide-react";

const LISTING_MSG = {
  listing1: {
    title: "listing1.title",
    type: "listing1.type",
    location: "listing1.location",
    features: "listing1.features",
  },
  listing2: {
    title: "listing2.title",
    type: "listing2.type",
    location: "listing2.location",
    features: "listing2.features",
  },
  listing3: {
    title: "listing3.title",
    type: "listing3.type",
    location: "listing3.location",
    features: "listing3.features",
  },
} as const;

type ListingId = keyof typeof LISTING_MSG;

function NationalCouncilTrustLogo({ alt }: { alt: string }) {
  return (
    <Image
      src="/footer/national-council-health-tourism.png"
      alt={alt}
      width={596}
      height={624}
      className="h-28 w-auto max-w-[15rem] object-contain opacity-90 sm:h-36 sm:max-w-[18rem] md:h-40 md:max-w-[22rem]"
    />
  );
}

interface ListingProps {
  title: string;
  type: string;
  location: string;
  features: string;
  image: string;
}

function AccommodationCard({ title, type, location, features, image }: ListingProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-4 start-4">
          <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
            {type}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h4 className="text-lg font-bold text-foreground line-clamp-1">{title}</h4>
        </div>
        <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{location}</span>
        </div>
        <div className="mt-auto flex items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Home className="h-4 w-4 text-primary/60" />
            <span className="line-clamp-1">{features}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function AccommodationTrust() {
  const t = await getTranslations("landing.accommodation");
  const tFooter = await getTranslations("footer");
  const councilLogoAlt = tFooter("supervisionCouncilAlt");
  const sectionId = "accommodation-trust-heading";

  const listings: { id: ListingId; image: string }[] = [
    {
      id: "listing1",
      image:
        "https://images.pexels.com/photos/18201945/pexels-photo-18201945.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: "listing2",
      image:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: "listing3",
      image:
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <section
      className="bg-background py-20 sm:py-24 border-t border-border/40"
      aria-labelledby={sectionId}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header Section: title stays readable width; lead uses full section width */}
        <div className="mb-12 space-y-4">
          <h2
            id={sectionId}
            className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("staysTitle")}
          </h2>
          <p className="w-full max-w-none text-pretty text-lg text-muted-foreground leading-relaxed">
            {t("staysLead")}
          </p>
        </div>

        {/* Listings Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => {
            const msg = LISTING_MSG[listing.id];
            return (
              <AccommodationCard
                key={listing.id}
                title={t(msg.title)}
                type={t(msg.type)}
                location={t(msg.location)}
                features={t(msg.features)}
                image={listing.image}
              />
            );
          })}
        </div>

        {/* Trust Banner */}
        <div className="mt-20 relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] to-transparent p-8 sm:p-12 shadow-sm">
          <div className="relative flex flex-col gap-10 md:flex-row md:items-center md:gap-12">
            <div className="min-w-0 flex-1 space-y-6">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {t("sealTitle")}
                </h3>
                <p className="max-w-3xl text-lg text-muted-foreground leading-relaxed">
                  {t("sealBody")}
                </p>
              </div>

              <div className="flex justify-center pt-2 md:hidden">
                <NationalCouncilTrustLogo alt={councilLogoAlt} />
              </div>

              <div className="pt-2">
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                  {t("officialMemberEtaa")}
                </span>
              </div>
            </div>
            <div className="hidden shrink-0 md:flex md:items-center">
              <NationalCouncilTrustLogo alt={councilLogoAlt} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
