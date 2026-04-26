import { AccommodationTrust } from "@/components/landing/accommodation-trust";
import { TransportationTeaser } from "@/components/landing/transportation-teaser";
import { AccreditedHospitals } from "@/components/landing/accredited-hospitals";
import { FinalCta } from "@/components/landing/final-cta";
import { LandingHero } from "@/components/landing/hero";
import { PainPoints } from "@/components/landing/pain-points";
import { Process } from "@/components/landing/process";
import { Programs } from "@/components/landing/programs";
import { TopDoctorsReels } from "@/components/landing/top-doctors-reels";
import { Trust } from "@/components/landing/trust";
import { WhyEgypt } from "@/components/landing/why-egypt";

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <WhyEgypt />
      <AccreditedHospitals />
      <TopDoctorsReels />
      <Programs />
      <AccommodationTrust />
      <TransportationTeaser />
      <PainPoints />
      <Process />
      <Trust />
      <FinalCta />
    </>
  );
}
