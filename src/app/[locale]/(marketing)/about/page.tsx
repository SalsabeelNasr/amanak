import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Globe, HeartPulse, Users, ShieldCheck, BadgeDollarSign, Plane, Building2, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  const whyEgyptFeatures = [
    {
      key: "whyEgypt1",
      icon: HeartPulse,
    },
    {
      key: "whyEgypt2",
      icon: Globe,
    },
    {
      key: "whyEgypt3",
      icon: ShieldCheck,
    },
    {
      key: "whyEgypt4",
      icon: BadgeDollarSign,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Redesigned Hero Section - Compact & Premium */}
      <section className="relative overflow-hidden border-b border-border/40 bg-muted/30 py-10 sm:py-12 lg:py-14 text-foreground">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-muted/60 via-muted/30 to-transparent rtl:bg-gradient-to-l" />

        <div className="container relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <div className="space-y-5 text-start rtl:text-right lg:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-1.5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <span className="text-xs font-bold tracking-widest uppercase text-primary">{t("heroBadge")}</span>
              </div>

              <div className="space-y-3 lg:space-y-4">
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.08]">
                  {t("heroTitle")}
                </h1>
                <p className="max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">
                  {t("heroLead")}
                </p>
              </div>

              <div className="pt-1">
                <Link
                  href={ROUTES.contactUs}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-full px-10 text-lg shadow-lg shadow-primary/15 transition-transform hover:scale-105",
                  )}
                >
                  {t("ctaPatient")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - Redesigned with Layered Layout */}
      <section className="py-24 sm:py-32 overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative grid gap-16 lg:grid-cols-12 lg:items-center">
            {/* Background decoration */}
            <div className="absolute -left-20 top-1/2 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
            
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                  <Users className="h-4 w-4" />
                  <span>Expertise</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
                  {t("teamTitle")}
                </h2>
                <p className="text-xl leading-relaxed text-muted-foreground max-w-2xl">
                  {t("teamBody")}
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {[
                  { title: "10+ Years Healthcare", desc: "Deep roots in medical systems" },
                  { title: "IT & Digital Excellence", desc: "Seamless patient coordination" },
                  { title: "Hospitality Expertise", desc: "5-star patient experience" },
                  { title: "Patient-First Care", desc: "Compassionate journey management" }
                ].map((item, i) => (
                  <div key={i} className="group flex gap-4 p-4 rounded-2xl border border-border/60 bg-card/50 transition-colors hover:border-primary/30">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-border shadow-2xl bg-muted">
                <Image
                  src="/landing/about-team-synergy-v5.png"
                  alt={t("teamImageAlt")}
                  fill
                  loading="eager"
                  className="object-cover"
                  sizes="(min-width: 1024px) 30vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                
                {/* Floating stat card */}
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/10 p-6 backdrop-blur-xl border border-white/20">
                  <p className="text-3xl font-bold text-white">10+</p>
                  <p className="text-sm font-medium text-white/80">Years of cross-industry synergy</p>
                </div>
              </div>
              
              {/* Decorative dots or shapes */}
              <div className="absolute -right-4 -top-4 -z-10 h-24 w-24 rounded-full bg-primary/10" />
            </div>
          </div>
        </div>
      </section>

      {/* Reach Section - Redesigned with Modern Cards */}
      <section className="bg-slate-50 py-24 sm:py-32 border-y border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
              <Globe className="h-4 w-4" />
              <span>Our Reach</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("reachTitle")}</h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {t("reachBody")}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Headquarters & Offices Card */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-[2rem] border border-border bg-background p-8 sm:p-12 shadow-sm">
              <div className="relative z-10 flex flex-col h-full justify-between space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t("addressTitle")}</h3>
                  <p className="text-lg text-muted-foreground max-w-md">{t("addressBody")}</p>
                </div>
                <div className="pt-8 border-t border-border/60">
                  <p className="text-sm font-bold uppercase tracking-wider text-primary mb-4">Regional Presence</p>
                  <div className="flex flex-wrap gap-6">
                    {["Libya", "Iraq", "Jordan"].map((city) => (
                      <div key={city} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-semibold text-foreground">{city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Destinations Card */}
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-primary p-8 sm:p-10 text-white shadow-xl">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                  <Plane className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">Destinations</h3>
                <ul className="space-y-4">
                  {["Jordan", "Turkey", "Dubai", "Egypt", "Europe"].map((dest) => (
                    <li key={dest} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="font-medium text-white/90">{dest}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Decorative circle */}
              <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Egypt Section - Redesigned with Premium Features */}
      <section className="py-24 sm:py-32 bg-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                <HeartPulse className="h-4 w-4" />
                <span>Why Egypt?</span>
              </div>
              <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl leading-tight">
                {t("whyEgyptTitle")}
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t("whyEgyptLead")}
              </p>
            </div>

            <div className="lg:col-span-8 grid gap-6 sm:grid-cols-2">
              {whyEgyptFeatures.map(({ key, icon: Icon }) => (
                <div key={key} className="group relative p-8 rounded-[2rem] border border-border/60 bg-card/50 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">{t(`${key}Title`)}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`${key}Body`)}
                  </p>
                  {/* Subtle number indicator */}
                  <span className="absolute top-8 right-8 text-4xl font-black text-foreground/[0.03] select-none group-hover:text-primary/5 transition-colors">
                    0{key.slice(-1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Partner Section - Reverted to High-Impact CTA Block */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 text-center sm:px-16 sm:py-20 shadow-2xl shadow-primary/20">
            {/* Background pattern */}
            <div className="absolute inset-0 -z-10 opacity-10">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white blur-3xl" />
              <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white blur-3xl" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("partnerTitle")}
              </h2>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/90 sm:text-xl">
                {t("partnerBody")}
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row pt-4">
                <Link
                  href={ROUTES.contactUs}
                  className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "rounded-full px-10 font-bold")}
                >
                  {t("ctaPatient")}
                </Link>
                <Link
                  href={`${ROUTES.contactUs}?intent=partner`}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-10 font-bold border-white text-white bg-transparent hover:bg-white hover:text-primary")}
                >
                  {t("ctaPartner")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
