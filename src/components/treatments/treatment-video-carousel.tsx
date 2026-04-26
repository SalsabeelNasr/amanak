"use client";

import { useTranslations } from "next-intl";
import type { Doctor, DoctorVideo, VideoSource } from "@/types";
import { videoEmbedSrc } from "@/lib/api/doctor-videos";
import { cn } from "@/lib/utils";

type Props = {
  videos: DoctorVideo[];
  doctorsById: Record<string, Doctor>;
};

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className={className}>
      <path d="M21.6 7.2a2.4 2.4 0 0 0-1.7-1.7C18.3 5 12 5 12 5s-6.3 0-7.9.5A2.4 2.4 0 0 0 2.4 7.2 25 25 0 0 0 1.9 12a25 25 0 0 0 .5 4.8 2.4 2.4 0 0 0 1.7 1.7C5.7 19 12 19 12 19s6.3 0 7.9-.5a2.4 2.4 0 0 0 1.7-1.7 25 25 0 0 0 .5-4.8 25 25 0 0 0-.5-4.8zM10 15V9l5 3-5 3z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const SOURCE_ICON: Record<VideoSource, (p: { className?: string }) => React.JSX.Element> = {
  youtube: YoutubeIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

const SOURCE_LABEL: Record<VideoSource, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
};

/** Vertical sources (IG reels, FB reels) get a 9/16 aspect; YouTube gets 16/9. */
function isVertical(source: VideoSource): boolean {
  return source === "instagram" || source === "facebook";
}

export function TreatmentVideoCarousel({ videos, doctorsById }: Props) {
  const t = useTranslations();

  if (!videos.length) return null;

  return (
    <section className="space-y-6 border-t border-border pt-12">
      <h3 className="text-2xl font-bold text-foreground">
        {t("treatments.videoLabel")}
      </h3>
      <div className="flex flex-wrap items-start justify-center gap-x-6 gap-y-10 sm:justify-start">
        {videos.map((v, idx) => {
          const doctor = doctorsById[v.doctorId];
          const Icon = SOURCE_ICON[v.source];
          const vertical = isVertical(v.source);
          const narrowTile = v.source !== "youtube";
          return (
            <article
              key={v.id}
              className={cn(
                narrowTile
                  ? "w-[min(280px,100%)] shrink-0 grow-0"
                  : "w-full min-w-0 max-w-3xl basis-full shrink-0",
              )}
            >
              <div
                className={`relative overflow-hidden rounded-2xl border border-border bg-muted shadow-sm ${
                  vertical ? "aspect-[9/16]" : "aspect-video"
                }`}
              >
                <iframe
                  src={videoEmbedSrc(v)}
                  title={doctor ? t(doctor.nameKey) : SOURCE_LABEL[v.source]}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading={idx < 2 ? "eager" : "lazy"}
                />
                <a
                  href={v.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={SOURCE_LABEL[v.source]}
                  className="absolute end-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition hover:bg-background"
                >
                  <Icon className="h-4 w-4" />
                </a>
              </div>
              {doctor && (
                <div className="mt-3 space-y-1 px-1">
                  <p className="text-sm font-bold text-foreground">
                    {t(doctor.nameKey)}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(doctor.titleKey)}
                  </p>
                  {v.captionKey && (
                    <p className="pt-1 text-xs text-muted-foreground/80">
                      {t(v.captionKey)}
                    </p>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
