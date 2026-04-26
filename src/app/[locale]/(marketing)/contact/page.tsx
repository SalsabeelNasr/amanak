import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { InquiryForm } from "@/components/inquiry-form";
import {
  getConsultantProfile,
  listAvailableSlots,
} from "@/lib/api/consultation-booking";
import { listTreatments } from "@/lib/api/treatments";
import { ConsultationBookingForm } from "./_components/consultation-booking-form";
import { Phone, MessageCircle, MapPin } from "lucide-react";

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
    label: tLabels(item.titleKey),
    slug: item.slug,
  }));

  const tAbout = await getTranslations("about");

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-2">
          <div className="min-h-0 space-y-8">
            <header className="space-y-4 text-start rtl:text-right">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {tContact("title")}
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {isPartnerIntent ? tContact("partnerLead") : tContact("lead")}
              </p>
            </header>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:bg-accent/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {tContact("phone")}
                  </p>
                  <a
                    href="tel:+201159187434"
                    dir="ltr"
                    className="block text-base font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    +20 115 918 7434
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:bg-accent/5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/10 text-[#25D366]">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {tContact("whatsapp")}
                  </p>
                  <a
                    href="https://wa.me/201159187434"
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="block text-base font-semibold text-foreground transition-colors hover:text-[#25D366]"
                  >
                    +20 115 918 7434
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transition-colors hover:bg-accent/5 sm:col-span-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {tContact("address")}
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {tAbout("addressBody")}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border shadow-sm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3454.2474932341233!2d31.479532976263544!3d30.029731618596646!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1458231018594271%3A0x629671d24873173e!2sBusiness%20Plaza%20Mall!5e0!3m2!1sen!2seg!4v1714151234567!5m2!1sen!2seg"
                width="100%"
                height="320"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Amanak Headquarters Location"
                className="grayscale transition-all duration-500 hover:grayscale-0"
              ></iframe>
            </div>
          </div>

          <div className="flex min-h-0 h-full flex-col">
            <InquiryForm treatments={treatments} className="min-h-0 flex-1" />
          </div>
        </div>
      </div>
      <section id="book-consultation" className="scroll-mt-24 border-t border-border bg-accent/5 py-12">
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
          <header className="space-y-3 text-start rtl:text-right">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
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
