import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Building2, CheckCircle2, Globe, Plane, Users } from "lucide-react";

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
      <section className="border-b border-border/40 bg-slate-50 py-24 sm:py-32" aria-labelledby="about-team-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 max-w-3xl space-y-4 text-start sm:mb-10 rtl:text-right">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
              <Users className="h-4 w-4" aria-hidden />
              <span>{t("teamBadge")}</span>
            </div>
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
          <div className="mb-16 max-w-3xl space-y-4 text-start">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
              <Globe className="h-4 w-4" aria-hidden />
              <span>{t("reachSectionBadge")}</span>
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("reachTitle")}</h2>
            <p className="text-xl leading-relaxed text-muted-foreground">{t("reachBody")}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-background p-8 text-start shadow-sm lg:col-span-2 sm:p-12">
              <div className="relative z-10 flex h-full flex-col justify-between space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{t("addressTitle")}</h3>
                  <p className="max-w-md text-lg text-muted-foreground">{t("addressBody")}</p>
                </div>
                <div className="border-t border-border/60 pt-8">
                  <p className="mb-4 text-sm font-bold uppercase tracking-wider text-primary">
                    {t("reachRegionalPresenceLabel")}
                  </p>
                  <div className="flex flex-wrap gap-6">
                    {presenceCountries.map((country) => (
                      <div key={country} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="font-semibold text-foreground">{country}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-border bg-primary p-8 text-start text-white shadow-xl sm:p-10">
              <div className="relative z-10 space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                  <Plane className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="text-2xl font-bold">{t("reachDestinationsTitle")}</h3>
                <ul className="space-y-4">
                  {destinationCountries.map((dest) => (
                    <li key={dest} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" aria-hidden />
                      </div>
                      <span className="font-medium text-white/90">{dest}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" aria-hidden />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
