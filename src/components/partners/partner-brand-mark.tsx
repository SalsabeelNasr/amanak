import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PartnerBrandMarkProps = {
  src?: string | null;
  alt: string;
  fallback: ReactNode;
  className?: string;
};

export function PartnerBrandMark({ src, alt, fallback, className }: PartnerBrandMarkProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-border/50 bg-background shadow-sm",
          className,
        )}
      >
        <Image src={src} alt={alt} fill sizes="44px" className="object-contain p-1.5" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-primary/5 text-primary",
        className,
      )}
      aria-hidden
    >
      {fallback}
    </div>
  );
}
