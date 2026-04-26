import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Activity, BedDouble, MapPin, ShieldCheck, Stethoscope, CheckCircle2, Microscope, Pill, Home, Globe, ScanLine } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { TransportationPartners } from "@/components/landing/transportation-partners";
import { PartnerBrandMark } from "@/components/partners/partner-brand-mark";
import { PartnerLogosMarquee } from "@/components/partners/partner-logos-marquee";
import {
  ACCOMMODATION_PLATFORM_LINKS,
  ACCOMMODATION_PROVIDER_LINKS,
  PARTNER_LAB_LOGOS,
  PARTNER_PHARMACY_LOGOS,
  PARTNER_RADIOLOGY_LOGOS,
} from "@/lib/partners-section-logos";
import { SupervisionLogosBanner } from "@/components/supervision-logos-banner";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "partners" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const CONTACT_PARTNER = `${ROUTES.contactUs}?intent=partner` as const;

export default async function PartnersPage() {
  const t = await getTranslations("partners");

  const whyKeys = ["why1", "why2", "why3", "why4"] as const;
  const typeDefs = [
    {
      key: "hospital" as const,
      icon: ShieldCheck,
    },
    {
      key: "doctor" as const,
      icon: Stethoscope,
    },
    {
      key: "clinic" as const,
      icon: MapPin,
    },
    {
      key: "hospitality" as const,
      icon: BedDouble,
    },
    {
      key: "transport" as const,
      icon: Activity,
    },
  ];
  const stepKeys = ["step1", "step2", "step3"] as const;
  const teamHighlightKeys = ["teamHighlight1", "teamHighlight2", "teamHighlight3", "teamHighlight4"] as const;
  const providerCategories = ["labs", "radiology"] as const;

  return (
    <div className="flex flex-col">
      {/* Hero Section - Compact & Premium (Matches About Us) */}
      <section className="relative flex items-center overflow-hidden bg-muted/30 py-10 sm:py-12 lg:py-14 text-foreground border-b border-border/40">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-muted/60 via-muted/30 to-transparent rtl:bg-gradient-to-l" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="order-2 space-y-5 text-start rtl:text-right lg:order-1 lg:space-y-6 rtl:lg:order-2">
              <div className="space-y-3 lg:space-y-4">
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.08]">
                  {t("heroTitle")}
                </h1>
                <p className="max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">
                  {t("heroLead")}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-1 rtl:justify-end">
                <Link
                  href={CONTACT_PARTNER}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-full px-10 text-lg shadow-lg shadow-primary/15 transition-transform hover:scale-105",
                  )}
                >
                  {t("ctaPrimary")}
                </Link>
              </div>
            </div>

            <div className="order-1 relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-lg lg:order-2 rtl:lg:order-1">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/landing/partners-hero-v3.png"
                  alt={t("heroImageAlt")}
                  fill
                  priority
                  className="object-cover"
                  sizes="(min-width: 1024px) 38vw, 100vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section - Layered Layout */}
      <section className="relative overflow-hidden border-t border-border/40 bg-muted py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative grid gap-16 lg:grid-cols-12 lg:items-center">
            {/* Background decoration */}
            <div className="absolute -left-20 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
            
            <div className="lg:col-span-12 space-y-12">
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
                  {t("whyTitle")}
                </h2>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {whyKeys.map((key, i) => (
                  <div key={key} className="group flex flex-col gap-4 p-6 rounded-3xl border border-border/60 bg-card/50 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-lg leading-relaxed text-muted-foreground font-medium">
                        {t(key)}
                      </p>
                    </div>
                    {/* Subtle number indicator */}
                    <span className="absolute top-6 right-6 text-4xl font-black text-foreground/[0.03] select-none group-hover:text-primary/5 transition-colors">
                      0{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Redesigned with Layered Layout (primary band, homepage Programs-style) */}
      <section className="relative overflow-hidden border-t border-primary/20 bg-primary py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative grid gap-16 lg:grid-cols-12 lg:items-center">
            <div className="absolute -left-20 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl leading-tight">
                  {t("teamTitle")}
                </h2>
                <p className="max-w-2xl text-xl leading-relaxed text-primary-foreground/85">
                  {t("teamBody")}
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {teamHighlightKeys.map((prefix) => (
                  <div
                    key={prefix}
                    className="group flex gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-colors hover:border-primary/25"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{t(`${prefix}Title`)}</h4>
                      <p className="text-sm text-muted-foreground">{t(`${prefix}Desc`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="relative aspect-[5/6] w-full overflow-hidden rounded-[2rem] border border-border bg-muted shadow-2xl">
                <Image
                  src="/landing/about-team-synergy-v5.png"
                  alt={t("teamImageAlt")}
                  fill
                  loading="eager"
                  className="object-cover object-[center_38%]"
                  sizes="(min-width: 1024px) 30vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
                  <p className="text-3xl font-bold text-white">{t("teamStatValue")}</p>
                  <p className="text-sm font-medium text-white/80">{t("teamStatLabel")}</p>
                </div>
              </div>

              <div className="absolute -right-4 -top-4 -z-10 h-24 w-24 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
      </section>

      {/* Who We Work With Section - Modern Cards */}
      <section className="border-t border-border/40 bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-8 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("typesTitle")}</h2>
          </div>
        </div>

        <div className="relative mb-12 sm:mb-16 overflow-hidden py-4 sm:py-6">
          <PartnerLogosMarquee />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {typeDefs.map(({ key, icon: Icon }) => (
              <div key={key} className="group relative flex flex-col items-start gap-4 rounded-3xl border border-border bg-background p-6 transition-all hover:border-primary/30 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold leading-tight text-foreground">{t(`types.${key}.title`)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`types.${key}.body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital Network Section - Cards Design */}
      <section className="border-t border-border/40 bg-muted py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("hospitalsListTitle")}</h2>
            <p className="text-lg text-muted-foreground">
              A curated network of Egypt&apos;s leading medical facilities, ensuring world-class care across major cities.
            </p>
          </div>

          <div className="space-y-12">
            {/* Cairo - Prominent Card */}
            <div className="rounded-[2.5rem] border border-border/60 bg-background p-8 sm:p-12 shadow-sm">
              <div className="flex items-center gap-4 mb-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{t("locations.cairo")}</h3>
                  <p className="text-sm font-medium text-primary uppercase tracking-widest">{t.raw("hospitalsList.cairo").length} Facilities</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                {(t.raw("hospitalsList.cairo") as string[]).map((hospital, idx) => (
                  <div key={idx} className="flex items-center gap-3 group">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                    <span className="text-[15px] font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                      {hospital}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Cities - Grid of Cards */}
            <div className="grid gap-8 lg:grid-cols-3">
              {[
                { key: "giza", icon: MapPin },
                { key: "alexandria", icon: MapPin },
                { key: "mansoura", icon: MapPin }
              ].map((loc) => (
                <div key={loc.key} className="rounded-[2rem] border border-border/60 bg-background p-8 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <loc.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{t(`locations.${loc.key}`)}</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t.raw(`hospitalsList.${loc.key}`).length} Facilities</p>
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {(t.raw(`hospitalsList.${loc.key}`) as string[]).map((hospital, idx) => (
                      <li key={idx} className="flex items-start gap-3 group">
                        <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-snug">
                          {hospital}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Providers Section (Labs & Radiology) — primary band */}
      <section className="relative overflow-hidden border-t border-primary/20 bg-primary py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.07] to-transparent" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl">
              {t("healthcareProvidersTitle")}
            </h2>
            <p className="text-lg text-primary-foreground/85">{t("healthcareProvidersLead")}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {providerCategories.map((category) => (
              <div
                key={category}
                className="group relative overflow-hidden rounded-[2.5rem] border border-border/60 bg-card p-8 sm:p-10 shadow-sm transition-all hover:border-primary/25 hover:shadow-xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {category === "labs" ? <Microscope className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t(`providerCategories.${category}`)}</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  {(t.raw(`providersList.${category}`) as string[]).map((provider, idx) => {
                    const logoSrc =
                      category === "labs" ? PARTNER_LAB_LOGOS[idx] : PARTNER_RADIOLOGY_LOGOS[idx];
                    const fallbackIcon =
                      category === "labs" ? (
                        <Microscope className="h-4 w-4" />
                      ) : (
                        <ScanLine className="h-4 w-4" />
                      );
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <PartnerBrandMark src={logoSrc} alt={provider} fallback={fallbackIcon} />
                        <span className="text-[15px] font-medium leading-tight text-muted-foreground">
                          {provider}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pharmacy Partners Section */}
      <section className="border-t border-border/40 bg-muted py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("pharmacyPartnersTitle")}</h2>
            <p className="text-lg text-muted-foreground">
              {t("pharmacyPartnersLead")}
            </p>
          </div>

          <div className="rounded-[2.5rem] border border-border/60 bg-background p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {(t.raw("pharmaciesList") as string[]).map((pharmacy, idx) => (
                <div key={idx} className="group flex items-center gap-3">
                  <PartnerBrandMark
                    src={PARTNER_PHARMACY_LOGOS[idx]}
                    alt={pharmacy}
                    fallback={<Pill className="h-4 w-4" />}
                  />
                  <span className="text-[15px] font-semibold leading-tight text-muted-foreground transition-colors group-hover:text-foreground">
                    {pharmacy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Accommodation Ecosystem Section */}
      <section className="py-24 sm:py-32 bg-background border-t border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("accommodationTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">{t("accommodationLead")}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border/60 bg-card p-8 sm:p-10 shadow-sm transition-all hover:border-primary/25 hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Globe className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{t("accommodation.platforms.title")}</h3>
              </div>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8 flex-grow">
                {t("accommodation.platforms.body")}
              </p>
              <div className="flex flex-wrap gap-x-10 gap-y-5 items-center border-t border-border/40 pt-6 opacity-80 transition-all duration-300 group-hover:opacity-100">
                {ACCOMMODATION_PLATFORM_LINKS.map(({ href, label, logoSrc }) => (
                  <Link
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 text-xl font-bold tracking-tight text-primary transition-colors hover:text-primary/80"
                  >
                    <PartnerBrandMark src={logoSrc} alt={label} fallback={<Globe className="h-4 w-4" aria-hidden />} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-border/60 bg-card p-8 sm:p-10 shadow-sm transition-all hover:border-primary/25 hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Home className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{t("accommodation.providers.title")}</h3>
              </div>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8 flex-grow">
                {t("accommodation.providers.body")}
              </p>
              <div className="flex flex-wrap gap-x-10 gap-y-5 items-center border-t border-border/40 pt-6 opacity-80 transition-all duration-300 group-hover:opacity-100">
                {ACCOMMODATION_PROVIDER_LINKS.map(({ href, label, logoSrc }) => (
                  <Link
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 text-xl font-bold tracking-tight text-primary transition-colors hover:text-primary/80"
                  >
                    <PartnerBrandMark src={logoSrc} alt={label} fallback={<Home className="h-4 w-4" aria-hidden />} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other partners — full transportation partner details */}
      <section className="py-24 sm:py-32 bg-background border-t border-border/40" aria-labelledby="other-partners-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 id="other-partners-heading" className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("otherPartnersTitle")}
            </h2>
            <p className="text-lg text-muted-foreground">{t("otherPartnersLead")}</p>
          </div>
          <TransportationPartners embedded />
        </div>
      </section>

      {/* How It Works Section - Process Steps */}
      <section className="border-t border-border/40 bg-muted py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
              <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
                {t("howTitle")}
              </h2>
            </div>

            <div className="lg:col-span-8 space-y-6">
              {stepKeys.map((key, index) => (
                <div
                  key={key}
                  className="group relative flex gap-6 rounded-[2.5rem] border border-border/60 bg-card/50 p-8 text-start transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-black text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {index + 1}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-foreground">{t(`how.${key}.title`)}</h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                      {t(`how.${key}.body`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SupervisionLogosBanner />

      {/* Final CTA - High-Impact Block (Matches About Us) */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[3rem] bg-primary px-8 py-16 text-center sm:px-16 sm:py-24 shadow-2xl shadow-primary/20">
            {/* Background pattern */}
            <div className="absolute inset-0 -z-10 opacity-10">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white blur-3xl" />
              <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white blur-3xl" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("ctaTitle")}
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/90 sm:text-xl">
                {t("ctaHint")}
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row pt-4">
                <Link
                  href={CONTACT_PARTNER}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "secondary" }),
                    "rounded-full px-12 h-14 text-lg font-bold shadow-xl transition-transform hover:scale-105",
                  )}
                >
                  {t("ctaPrimary")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
