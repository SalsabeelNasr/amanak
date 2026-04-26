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
      general: t("categories.general"),
      ortho: t("categories.ortho"),
      cosmetic: t("categories.cosmetic"),
      dental: t("categories.dental"),
      mental: t("categories.mental"),
    },
    priceLabel: t("priceLabel"),
    viewTreatment: t("viewTreatment"),
  };

  return (
    <div className="mx-auto max-w-6xl min-w-0 px-4 pt-8 pb-16 sm:px-6 sm:pt-12 sm:pb-32 lg:pt-14">
      <TreatmentTabs items={tabItems} labels={tabLabels} />
    </div>
  );
}
