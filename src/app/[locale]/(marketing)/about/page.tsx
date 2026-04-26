import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Building2, CheckCircle2, Plane } from "lucide-react";
import { SupervisionLogosBanner } from "@/components/supervision-logos-banner";

type Props = { params: Promise<{ locale: string }> };

type TeamMember = {
  name: string;
  role: string;
  imageAlt: string;
  imageUrl: string;
};

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
  const teamMembers = t.raw("teamMembers") as TeamMember[];
  const presenceCountries = t.raw("reachPresenceCountries") as string[];
  const destinationCountries = t.raw("reachDestinationCountries") as string[];

  return (
    <div className="flex flex-col">
      {/* Our team (first section) */}
      <section
        className="border-b border-border/40 bg-slate-50 pt-10 pb-24 sm:pt-12 sm:pb-32 lg:pt-14"
        aria-labelledby="about-team-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 max-w-3xl space-y-4 text-start sm:mb-10 rtl:text-right">
            <h1 id="about-team-heading" className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("teamTitle")}
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">{t("teamLead")}</p>
          </div>

          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {teamMembers.map((member) => (
              <li key={member.name}>
                <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative aspect-square w-full bg-muted">
                    <Image
                      src={member.imageUrl}
                      alt={member.imageAlt}
                      fill
                      className="object-cover object-[center_22%]"
                      sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-5 text-start sm:p-6 rtl:text-right">
                    <h2 className="text-lg font-bold tracking-tight text-foreground">{member.name}</h2>
                    <p className="text-sm font-medium text-primary">{member.role}</p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Reach — second section (restored) */}
      <section className="border-b border-border/40 bg-background py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl space-y-3 text-start">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{t("reachTitle")}</h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{t("reachBody")}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3 lg:gap-6">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 text-start shadow-sm lg:col-span-2 sm:p-8">
              <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                <div className="space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">{t("addressTitle")}</h3>
                  <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">{t("addressBody")}</p>
                </div>
                <div className="border-t border-border/60 pt-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-primary">
                    {t("reachRegionalPresenceLabel")}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {presenceCountries.map((country) => (
                      <div key={country} className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="text-sm font-semibold text-foreground">{country}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-primary p-6 text-start text-white shadow-lg sm:p-7">
              <div className="relative z-10 space-y-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm">
                  <Plane className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-bold sm:text-xl">{t("reachDestinationsTitle")}</h3>
                <ul className="space-y-2.5">
                  {destinationCountries.map((dest) => (
                    <li key={dest} className="flex items-center gap-2.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <CheckCircle2 className="h-3 w-3 text-white" aria-hidden />
                      </div>
                      <span className="text-sm font-medium text-white/90">{dest}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
            </div>
          </div>
        </div>
      </section>

      <SupervisionLogosBanner className="py-24 sm:py-32" />
    </div>
  );
}
