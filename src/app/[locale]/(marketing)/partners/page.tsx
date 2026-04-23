import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Activity, BedDouble, MapPin, ShieldCheck, Stethoscope, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="flex flex-col">
      {/* Hero Section - Compact & Premium (Matches About Us) */}
      <section className="relative flex items-center overflow-hidden bg-muted/30 py-10 sm:py-12 lg:py-14 text-foreground border-b border-border/40">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-muted/60 via-muted/30 to-transparent rtl:bg-gradient-to-l" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
            <div className="order-2 space-y-5 text-start rtl:text-right lg:order-1 lg:space-y-6 rtl:lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <span className="text-xs font-bold tracking-widest uppercase text-primary">Partnership</span>
              </div>

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
      <section className="py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative grid gap-16 lg:grid-cols-12 lg:items-center">
            {/* Background decoration */}
            <div className="absolute -left-20 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
            
            <div className="lg:col-span-12 space-y-12">
              <div className="text-center max-w-3xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t("whyBadge")}</span>
                </div>
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

      {/* Who We Work With Section - Modern Cards */}
      <section className="bg-slate-50 py-24 sm:py-32 border-y border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
              <Activity className="h-4 w-4" />
              <span>{t("typesBadge")}</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("typesTitle")}</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {typeDefs.map(({ key, icon: Icon }) => (
              <Card key={key} className="group relative overflow-hidden rounded-[2rem] border border-border bg-background transition-all hover:border-primary/30 hover:shadow-lg">
                <CardHeader className="space-y-4 p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-7 w-7" aria-hidden />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold leading-snug">{t(`types.${key}.title`)}</CardTitle>
                    <CardDescription className="text-base leading-relaxed text-muted-foreground">
                      {t(`types.${key}.body`)}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Process Steps */}
      <section className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                <ArrowRight className="h-4 w-4" />
                <span>{t("howBadge")}</span>
              </div>
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
                Ready to Grow Together?
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
