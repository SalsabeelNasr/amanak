"use client";

import Image from "next/image";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

export type PartnerBrandLogo = {
  name: string;
  src: string;
};

/** Logos used in the partners marquee (assets under `/public/partners/`). */
export const PARTNER_BRAND_LOGOS: ReadonlyArray<PartnerBrandLogo> = [
  { name: "Andalusia Hospitals", src: "/partners/andalusia.png" },
  { name: "Saudi German Hospitals", src: "/partners/saudi-german.png" },
  { name: "Cleopatra Hospitals Group", src: "/partners/cleopatra.webp" },
  { name: "As-Salam International Hospital", src: "/partners/as-salam.webp" },
  { name: "Dar Al Fouad Hospital", src: "/partners/dar-al-fouad.png" },
  { name: "Al Mokhtabar Labs", src: "/partners/al-mokhtabar.png" },
  { name: "Al Borg Laboratories", src: "/partners/al-borg.png" },
  { name: "Alfa Scan", src: "/partners/alfa-scan.png" },
  { name: "CairoScan", src: "/partners/cairo-scan.png" },
  { name: "El Ezaby Pharmacy", src: "/partners/el-ezaby.png" },
  { name: "Seif Pharmacies", src: "/partners/seif.png" },
  { name: "El-Tarshouby Pharmacies", src: "/partners/el-tarshouby.png" },
  { name: "Misr Pharmacies", src: "/partners/misr-pharmacies.png" },
  { name: "Maat Stays", src: "/partners/maat-stays.jpg" },
  { name: "Xuru Stays", src: "/partners/xuru-stays.svg" },
  { name: "Kennah Stays", src: "/partners/kennah-stays.png" },
  { name: "JTNY", src: "/partners/jtny.png" },
  { name: "Arrw", src: "/partners/arrw.png" },
];

function repeatLogos(logos: ReadonlyArray<PartnerBrandLogo>, times: number): PartnerBrandLogo[] {
  return Array.from({ length: times }, () => [...logos]).flat();
}

const MAX_LIST_REPEATS = 6;
const MIN_LIST_REPEATS = 3;
const DURATION_SEC = 58;

function flexRowGapPx(track: HTMLElement): number {
  const { columnGap, gap } = getComputedStyle(track);
  const raw = columnGap && columnGap !== "normal" ? columnGap : gap;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function LogoTile({ logo }: { logo: PartnerBrandLogo }) {
  return (
    <div className="relative flex h-12 w-28 shrink-0 items-center justify-center sm:h-14 sm:w-36">
      <Image
        src={logo.src}
        alt={logo.name}
        fill
        sizes="(min-width: 640px) 144px, 112px"
        className="object-contain opacity-70 transition-opacity duration-300 hover:opacity-100"
      />
    </div>
  );
}

export function PartnerLogosMarquee() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstSegmentRef = useRef<HTMLDivElement>(null);
  const [listRepeats, setListRepeats] = useState(MIN_LIST_REPEATS);
  const [shiftPx, setShiftPx] = useState(0);

  const segment = useMemo(() => repeatLogos(PARTNER_BRAND_LOGOS, listRepeats), [listRepeats]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const first = firstSegmentRef.current;
    if (!viewport || !track || !first) return;

    const sync = () => {
      const vw = viewport.clientWidth;
      const sw = first.getBoundingClientRect().width;
      if (sw <= 0 || vw <= 0) return;

      // One loop = first segment + flex gap before the duplicate (matches spacing between logos).
      setShiftPx(sw + flexRowGapPx(track));

      setListRepeats((n) => {
        if (n >= MAX_LIST_REPEATS || sw >= vw * 1.12) return n;
        return n + 1;
      });
    };

    const ro = new ResizeObserver(sync);
    ro.observe(viewport);
    ro.observe(track);
    ro.observe(first);
    sync();

    return () => ro.disconnect();
  }, [segment]);

  const trackStyle = {
    ["--marquee-shift" as string]: `${shiftPx}px`,
    ...(shiftPx > 0
      ? { animation: `marquee-seamless-px ${DURATION_SEC}s linear infinite` as const }
      : {}),
  };

  return (
    <div ref={viewportRef} className="relative w-full min-w-0 overflow-hidden" aria-label="Partner brands">
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-10 bg-gradient-to-r from-background via-background/90 to-transparent rtl:bg-gradient-to-l" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-10 bg-gradient-to-l from-background via-background/90 to-transparent rtl:bg-gradient-to-r" />

      <div
        ref={trackRef}
        dir="ltr"
        className="flex w-max shrink-0 flex-nowrap items-stretch gap-10 py-6 sm:gap-14 backface-hidden will-change-transform transform-gpu"
        style={trackStyle}
      >
        <div ref={firstSegmentRef} className="flex shrink-0 flex-nowrap items-center gap-10 sm:gap-14">
          {segment.map((logo, i) => (
            <LogoTile key={`seg-a-${logo.src}-${i}`} logo={logo} />
          ))}
        </div>
        <div className="flex shrink-0 flex-nowrap items-center gap-10 sm:gap-14" aria-hidden>
          {segment.map((logo, i) => (
            <LogoTile key={`seg-b-${logo.src}-${i}`} logo={logo} />
          ))}
        </div>
      </div>
    </div>
  );
}
