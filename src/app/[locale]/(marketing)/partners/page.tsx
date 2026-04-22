import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Activity, BedDouble, MapPin, ShieldCheck, Stethoscope } from "lucide-react";
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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {t("heroTitle")}
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">{t("heroLead")}</p>
      </header>

      <section className="mx-auto mt-14 max-w-3xl space-y-6">
        <h2 className="text-center text-2xl font-bold text-foreground">{t("whyTitle")}</h2>
        <ul className="space-y-4 text-start text-muted-foreground">
          {whyKeys.map((key) => (
            <li key={key} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="leading-relaxed">{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16 space-y-8">
        <h2 className="text-center text-2xl font-bold text-foreground">{t("typesTitle")}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {typeDefs.map(({ key, icon: Icon }) => (
            <Card key={key} className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" aria-hidden />
                </div>
                <CardTitle className="text-lg leading-snug">{t(`types.${key}.title`)}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t(`types.${key}.body`)}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-3xl space-y-6">
        <h2 className="text-center text-2xl font-bold text-foreground">{t("howTitle")}</h2>
        <ol className="space-y-4">
          {stepKeys.map((key, index) => (
            <li
              key={key}
              className="flex gap-4 rounded-2xl border border-border bg-card p-5 text-start shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-foreground">{t(`how.${key}.title`)}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {t(`how.${key}.body`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mx-auto mt-16 flex max-w-xl flex-col items-center gap-4 text-center">
        <Link
          href={CONTACT_PARTNER}
          className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full sm:w-auto")}
          prefetch={false}
        >
          {t("ctaPrimary")}
        </Link>
        <p className="max-w-md text-sm text-muted-foreground">{t("ctaHint")}</p>
      </div>
    </div>
  );
}
