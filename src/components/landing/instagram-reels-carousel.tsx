"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import type { DoctorReelItem } from "@/lib/landing/doctor-reel-embeds";
import { instagramEmbedSrc } from "@/lib/landing/doctor-reel-embeds";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  items: readonly DoctorReelItem[];
  className?: string;
};

/** Horizontal carousel; inner scroller is `dir="ltr"` so scroll physics match arrow direction everywhere. */
export function InstagramReelsCarousel({ items, className }: Props) {
  const t = useTranslations("landing.topDoctorsReels");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBySlide = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-reel-slide]");
    const delta = slide?.offsetWidth
      ? slide.offsetWidth + 16
      : Math.min(360, el.clientWidth * 0.88);
    el.scrollBy({ left: direction * delta, behavior: "smooth" });
  }, []);

  return (
    <div className={cn("relative", className)}>
      <p className="mb-3 text-center text-sm text-muted-foreground md:text-start">
        {t("scrollHint")}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute start-0 top-1/2 z-10 hidden -translate-y-1/2 shadow-md md:flex"
        aria-label={t("prevReel")}
        onClick={() => scrollBySlide(-1)}
      >
        <ChevronLeft className="size-5 rtl:-scale-x-100" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute end-0 top-1/2 z-10 hidden -translate-y-1/2 shadow-md md:flex"
        aria-label={t("nextReel")}
        onClick={() => scrollBySlide(1)}
      >
        <ChevronRight className="size-5 rtl:-scale-x-100" aria-hidden />
      </Button>

      <div
        ref={scrollerRef}
        dir="ltr"
        className={cn(
          "flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-2 [-ms-overflow-style:none] [scrollbar-width:none]",
          "[&::-webkit-scrollbar]:hidden",
          "px-1 md:px-12",
        )}
      >
        {items.map((item, index) => (
          <article
            key={item.embedPath}
            data-reel-slide
            className="w-[min(100%,20.5rem)] shrink-0 snap-center md:w-[20.5rem]"
          >
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <iframe
                src={instagramEmbedSrc(item.embedPath)}
                title={`${t("iframeTitle")} ${index + 1}`}
                className="h-[26rem] w-full max-w-full border-0 bg-muted sm:h-[30rem] md:h-[34rem]"
                allowFullScreen
                loading={index < 2 ? "eager" : "lazy"}
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <a
              href={item.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-sm font-medium text-primary underline-offset-4 hover:underline md:text-start"
            >
              {t("openInstagram")}
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
