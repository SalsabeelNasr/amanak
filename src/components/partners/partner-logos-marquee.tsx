import Image from "next/image";

type Logo = {
  name: string;
  src: string;
};

const LOGOS: ReadonlyArray<Logo> = [
  { name: "Andalusia Hospitals", src: "/partners/andalusia.png" },
  { name: "Saudi German Hospitals", src: "/partners/saudi-german.png" },
  { name: "Cleopatra Hospitals Group", src: "/partners/cleopatra.webp" },
  { name: "As-Salam International Hospital", src: "/partners/as-salam.webp" },
  { name: "Dar Al Fouad Hospital", src: "/partners/dar-al-fouad.png" },
  { name: "JTNY", src: "/partners/jtny.png" },
  { name: "Arrw", src: "/partners/arrw.png" },
];

export function PartnerLogosMarquee() {
  const items = [...LOGOS, ...LOGOS];

  return (
    <div className="relative w-full overflow-hidden" aria-label="Partner brands">
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent rtl:bg-gradient-to-l" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent rtl:bg-gradient-to-r" />

      <div
        className="flex w-max items-center gap-12 py-6 sm:gap-16"
        style={{ animation: "amanak-marquee 45s linear infinite" }}
      >
        {items.map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className="relative flex h-12 w-28 shrink-0 items-center justify-center sm:h-14 sm:w-36"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              fill
              sizes="(min-width: 640px) 144px, 112px"
              className="object-contain opacity-70 transition-opacity duration-300 hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
