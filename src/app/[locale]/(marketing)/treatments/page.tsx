import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { listTreatments } from "@/lib/api/treatments";
import { TreatmentTabs } from "@/components/treatments/treatment-tabs";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "treatments" });
  return {
    title: t("pageTitle"),
    description: t("pageLead"),
  };
}

export default async function TreatmentsIndexPage() {
  const [t, items, tGlobal] = await Promise.all([
    getTranslations("treatments"),
    listTreatments(),
    getTranslations(),
  ]);

  const tabItems = items.map((item) => ({
    id: item.id,
    slug: item.slug,
    category: item.category,
    priceUSD: item.priceUSD,
    title: tGlobal(item.titleKey),
    description: tGlobal(item.descriptionKey),
  }));

  const tabLabels = {
    categories: {
      all: t("categories.all"),
      general: t("categories.general"),
      ortho: t("categories.ortho"),
      cosmetic: t("categories.cosmetic"),
    },
    priceLabel: t("priceLabel"),
    viewTreatment: t("viewTreatment"),
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-20 sm:px-6">
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{t("pageTitle")}</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">{t("pageLead")}</p>
      </div>

      <TreatmentTabs items={tabItems} labels={tabLabels} />
    </div>
  );
}
