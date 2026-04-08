import { getTranslations } from "next-intl/server";
import { listTreatments } from "@/lib/api/treatments";
import { InquiryForm } from "@/components/inquiry-form";

export default async function InquiryPage() {
  const [t, items] = await Promise.all([
    getTranslations("inquiry"),
    listTreatments(),
  ]);
  const labels = await getTranslations();

  const treatments = items.map((item) => ({
    slug: item.slug,
    label: labels(item.titleKey),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("lead")}</p>
      </div>
      <InquiryForm treatments={treatments} />
    </div>
  );
}
