import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InquiryForm } from "@/components/inquiry-form";
import {
  getConsultantProfile,
  listAvailableSlots,
} from "@/lib/api/consultation-booking";
import { listTreatments } from "@/lib/api/treatments";
import { ConsultationBookingForm } from "./_components/consultation-booking-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ intent?: string | string[] }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ContactPage({ searchParams }: Props) {
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const to = new Date(from.getTime() + 45 * 86_400_000);

  const [tContact, tLabels, items, sp, initialSlots, consultant] =
    await Promise.all([
      getTranslations("contact"),
      getTranslations(),
      listTreatments(),
      searchParams,
      listAvailableSlots({ from, to }),
      getConsultantProfile(),
    ]);

  const intent = sp.intent;
  const intentStr = Array.isArray(intent) ? intent[0] : intent;
  const isPartnerIntent = intentStr === "partner";

  const treatments = items.map((item) => ({
    slug: item.slug,
    label: tLabels(item.titleKey),
  }));

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <header className="space-y-3 text-start">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {tContact("title")}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {isPartnerIntent ? tContact("partnerLead") : tContact("lead")}
            </p>
          </header>
          <InquiryForm treatments={treatments} />
        </div>
      </div>
      <section id="book-consultation" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
          <header className="space-y-3 text-start">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {tContact("bookingTitle")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {tContact("bookingLead")}
            </p>
          </header>
        </div>
        <ConsultationBookingForm
          initialSlots={initialSlots}
          consultant={consultant}
        />
      </section>
    </>
  );
}
