import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InquiryForm } from "@/components/inquiry-form";
import { listTreatments } from "@/lib/api/treatments";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ContactPage() {
  const [tContact, tLabels, items] = await Promise.all([
    getTranslations("contact"),
    getTranslations(),
    listTreatments(),
  ]);

  const treatments = items.map((item) => ({
    slug: item.slug,
    label: tLabels(item.titleKey),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-3 text-start">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {tContact("title")}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {tContact("lead")}
          </p>
        </header>
        <InquiryForm treatments={treatments} />
      </div>
    </div>
  );
}
