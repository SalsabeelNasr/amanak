import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ConsultationBookingForm } from "@/app/[locale]/(marketing)/book-consultation/_components/consultation-booking-form";
import {
  getConsultantProfile,
  listAvailableSlots,
} from "@/lib/api/consultation-booking";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "consultationBooking",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function BookConsultationPage() {
  const now = new Date();
  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const to = new Date(from.getTime() + 45 * 86_400_000);

  const [initialSlots, consultant] = await Promise.all([
    listAvailableSlots({ from, to }),
    getConsultantProfile(),
  ]);

  return (
    <ConsultationBookingForm
      initialSlots={initialSlots}
      consultant={consultant}
    />
  );
}
