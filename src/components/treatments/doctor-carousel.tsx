"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Globe } from "lucide-react";
import type { Doctor } from "@/types";

type Props = {
  doctors: Doctor[];
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect width="4" height="12" x="2" y="9"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

export function DoctorCarousel({ doctors }: Props) {
  const t = useTranslations();

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
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted mb-4 flex items-center justify-center">
              {/* Fallback that shows behind the image, or if the image is hidden/missing */}
              <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-secondary/20 text-secondary-foreground/40">
                <span className="text-4xl font-bold">{t(doctor.nameKey).charAt(0)}</span>
              </div>

              {doctor.image && (
                <img
                  src={doctor.image}
                  alt={t(doctor.nameKey)}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 z-10"
                  onError={(e) => {
                    // Hide the image if it fails to load so the fallback initials show
                    e.currentTarget.style.opacity = '0';
                  }}
                />
              )}
            </div>
            
            <div className="space-y-2 px-1">
              <div>
                <h4 className="text-lg font-bold text-foreground">
                  {t(doctor.nameKey)}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(doctor.titleKey)}
                </p>
                {doctor.subSpecialtyKey && (
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-primary/80">
                    {t(doctor.subSpecialtyKey)}
                  </p>
                )}
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {doctor.instagram && (
                  <a
                    href={doctor.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-[#E1306C]/10 hover:text-[#E1306C]"
                    aria-label="Instagram"
                  >
                    <InstagramIcon className="h-4 w-4" />
                  </a>
                )}
                {doctor.facebook && (
                  <a
                    href={doctor.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-[#1877F2]/10 hover:text-[#1877F2]"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="h-4 w-4" />
                  </a>
                )}
                {doctor.linkedin && (
                  <a
                    href={doctor.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-[#0A66C2]/10 hover:text-[#0A66C2]"
                    aria-label="LinkedIn"
                  >
                    <LinkedinIcon className="h-4 w-4" />
                  </a>
                )}
                {doctor.website && (
                  <a
                    href={doctor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                    aria-label="Website"
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
