import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTreatmentBySlug, listTreatments } from "@/lib/api/treatments";
import { getDoctorsByIds } from "@/lib/api/doctors";
import { getVideosForTreatment } from "@/lib/api/doctor-videos";
import {
  HAIR_TRANSPLANT_VARIANTS,
  isMergedHairTransplantTreatmentSlug,
} from "@/lib/api/hair-transplant-variants";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DoctorCarousel } from "@/components/treatments/doctor-carousel";
import { HairTransplantTypeSections } from "@/components/treatments/hair-transplant-type-sections";
import { TreatmentVideoCarousel } from "@/components/treatments/treatment-video-carousel";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const items = await listTreatments();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const treatment = await getTreatmentBySlug(slug);
  const t = await getTranslations({ locale, namespace: "treatments" });
  if (!treatment) {
    return { title: t("pageTitle") };
  }
  const labels = await getTranslations({ locale });
  const title = labels(treatment.titleKey);
  const description = labels(treatment.descriptionKey);
  return { title, description };
}

/** Render a paragraph with `**bold**` segments wrapped in <strong>. */
function renderInlineBold(p: string) {
  const parts = p.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

function BodyText({ text }: { text: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          {renderInlineBold(p)}
        </p>
      ))}
    </div>
  );
}

export default async function TreatmentDetailPage({ params }: Props) {
  const { slug } = await params;
  const [treatment, t, labels] = await Promise.all([
    getTreatmentBySlug(slug),
    getTranslations("treatments"),
    getTranslations(),
  ]);

  if (!treatment) notFound();

  const [doctors, videos] = await Promise.all([
    treatment.doctorIds ? getDoctorsByIds(treatment.doctorIds) : Promise.resolve([]),
    getVideosForTreatment(treatment.slug),
  ]);
  const doctorsById = Object.fromEntries(doctors.map((d) => [d.id, d]));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:space-y-12 sm:px-6 sm:py-16">
      <div className="min-w-0 space-y-3 sm:space-y-4">
        <Link
          href={ROUTES.treatments}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
          prefetch={false}
        >
          <span className="text-xs">←</span> {t("backToAllTreatments")}
        </Link>
        <h1 className="text-balance text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {labels(treatment.titleKey)}
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-xl">
          {labels(treatment.descriptionKey)}
        </p>
      </div>

      <div className="grid min-w-0 gap-8 sm:gap-12 lg:grid-cols-3">
        <div className="min-w-0 space-y-8 sm:space-y-12 lg:col-span-2">
          <section className="prose prose-slate max-w-none min-w-0 dark:prose-invert">
            <BodyText text={labels(treatment.bodyKey)} />
          </section>

          {isMergedHairTransplantTreatmentSlug(treatment.slug) ? (
            <HairTransplantTypeSections
              heading={t("hairTransplantTypesHeading")}
              variants={HAIR_TRANSPLANT_VARIANTS}
              labels={labels}
              priceLabel={t("priceLabel")}
            />
          ) : null}

          {doctors.length > 0 && (
            <section className="border-t border-border pt-12">
              <DoctorCarousel doctors={doctors} />
            </section>
          )}

          <TreatmentVideoCarousel videos={videos} doctorsById={doctorsById} />
        </div>

        <aside className="min-w-0 space-y-8">
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:rounded-3xl sm:space-y-6 sm:p-8">
              {treatment.successRateKey && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-primary/70">
                    {t("successRateLabel")}
                  </p>
                  <p className="w-full text-lg font-bold leading-relaxed text-foreground sm:text-xl">
                    {labels(treatment.successRateKey)}
                  </p>
                </div>
              )}

              {treatment.techniquesKey && (
                <div className="space-y-3 pt-6 border-t border-border/50">
                  <p className="text-xs font-semibold text-primary/70">
                    {t("techniquesLabel")}
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {labels(treatment.techniquesKey)}
                  </p>
                </div>
              )}

              {treatment.hospitalsKey && (
                <div className="space-y-3 pt-6 border-t border-border/50">
                  <p className="text-xs font-semibold text-primary/70">
                    {t("hospitalsLabel")}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {labels(treatment.hospitalsKey)}
                  </p>
                </div>
              )}

              <div className="pt-8 space-y-3">
                {treatment.priceUSD && (
                  <div className="flex flex-col gap-1 pb-4 mb-4 border-b border-border/50">
                    <span className="text-xs font-semibold text-primary/70">
                      {t("priceLabel")}
                    </span>
                    <span className="text-2xl font-black text-foreground sm:text-3xl">
                      ${treatment.priceUSD.toLocaleString()}
                    </span>
                  </div>
                )}
                <Link
                  href={ROUTES.contactUs}
                  className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full font-bold shadow-lg shadow-primary/20")}
                  prefetch={false}
                >
                  {t("contactCta")}
                </Link>
                <Link
                  href={ROUTES.treatments}
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full rounded-full font-bold")}
                  prefetch={false}
                >
                  {t("viewAll")}
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
