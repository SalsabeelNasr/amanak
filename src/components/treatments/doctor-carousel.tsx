import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { Doctor } from "@/types";

type Props = {
  doctors: Doctor[];
};

export async function DoctorCarousel({ doctors }: Props) {
  const t = await getTranslations();

  if (!doctors || doctors.length === 0) return null;

  return (
    <div className="space-y-6 py-8">
      <h3 className="text-2xl font-bold text-foreground px-1">
        {t("treatments.doctorsLabel")}
      </h3>
      
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory">
        {doctors.map((doctor) => (
          <div 
            key={doctor.id}
            className="flex-none w-[280px] snap-start group"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted mb-4">
              {doctor.image ? (
                <Image
                  src={doctor.image}
                  alt={t(doctor.nameKey)}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary/20 text-secondary-foreground/40">
                  <span className="text-4xl font-bold">{t(doctor.nameKey).charAt(0)}</span>
                </div>
              )}
              
              {doctor.instagram && (
                <a
                  href={doctor.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#E1306C] shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                  aria-label="Instagram"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              )}
            </div>
            
            <div className="space-y-1 px-1">
              <h4 className="text-lg font-bold text-foreground">
                {t(doctor.nameKey)}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(doctor.titleKey)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
