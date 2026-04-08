import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getTreatmentBySlug, listTreatments } from "@/lib/api/treatments";
import { getDoctorsByIds } from "@/lib/api/doctors";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DoctorCarousel } from "@/components/treatments/doctor-carousel";

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

function BodyText({ text }: { text: string }) {
  const paragraphs = text.split("\n\n").filter(Boolean);
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="leading-relaxed text-muted-foreground text-lg">
          {p}
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

  const doctors = treatment.doctorIds 
    ? await getDoctorsByIds(treatment.doctorIds)
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 py-16 sm:px-6">
      <div className="space-y-4">
        <Link
          href={ROUTES.treatments}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          prefetch={false}
        >
          <span className="text-xs">←</span> {t("pageTitle")}
        </Link>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{labels(treatment.titleKey)}</h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">{labels(treatment.descriptionKey)}</p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-12">
          <section className="prose prose-slate dark:prose-invert max-w-none">
            <BodyText text={labels(treatment.bodyKey)} />
          </section>

          {doctors.length > 0 && (
            <section className="border-t border-border pt-12">
              <DoctorCarousel doctors={doctors} />
            </section>
          )}

          {treatment.videoUrlKey && (
            <section className="space-y-6 border-t border-border pt-12">
              <h3 className="text-2xl font-bold text-foreground">{t("videoLabel")}</h3>
              <div className="aspect-video overflow-hidden rounded-3xl border border-border bg-muted shadow-2xl">
                <iframe
                  src={labels(treatment.videoUrlKey)}
                  title={labels(treatment.titleKey)}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-8">
          <div className="sticky top-24 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-8 shadow-sm space-y-6">
              {treatment.successRateKey && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                    {t("successRateLabel")}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-xl font-bold text-foreground">
                      {labels(treatment.successRateKey)}
                    </p>
                  </div>
                </div>
              )}

              {treatment.techniquesKey && (
                <div className="space-y-3 pt-6 border-t border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                    {t("techniquesLabel")}
                  </p>
                  <p className="text-sm font-medium text-foreground leading-relaxed">
                    {labels(treatment.techniquesKey)}
                  </p>
                </div>
              )}

              {treatment.hospitalsKey && (
                <div className="space-y-3 pt-6 border-t border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
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
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">
                      {t("priceLabel")}
                    </span>
                    <span className="text-3xl font-black text-foreground">
                      ${treatment.priceUSD.toLocaleString()}
                    </span>
                  </div>
                )}
                <Link
                  href={ROUTES.inquiry}
                  className={cn(buttonVariants({ size: "lg" }), "w-full rounded-full font-bold shadow-lg shadow-primary/20")}
                  prefetch={false}
                >
                  {t("inquiryCta")}
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
