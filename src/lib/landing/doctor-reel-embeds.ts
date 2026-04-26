/**
 * Sample Instagram reels/posts shown on the landing page carousel.
 * `embedPath` must match Instagram’s embed URL: instagram.com/{embedPath}/embed
 */
export type DoctorReelItem = {
  /** Full share URL for "open in Instagram" and attribution */
  canonicalUrl: string;
  /** `reel/SHORTCODE` or `p/SHORTCODE` */
  embedPath: string;
};

export const DOCTOR_REEL_EMBEDS: readonly DoctorReelItem[] = [
  {
    canonicalUrl: "https://www.instagram.com/reel/DHBasUMN31l/",
    embedPath: "reel/DHBasUMN31l",
  },
  {
    canonicalUrl: "https://www.instagram.com/reel/DQzP69tjUhV/",
    embedPath: "reel/DQzP69tjUhV",
  },
  {
    canonicalUrl: "https://www.instagram.com/reel/C33lugHoJpC/",
    embedPath: "reel/C33lugHoJpC",
  },
  {
    canonicalUrl: "https://www.instagram.com/reel/DU--bWHkeKO/",
    embedPath: "reel/DU--bWHkeKO",
  },
  {
    canonicalUrl: "https://www.instagram.com/reel/DUJiyOEiHRR/",
    embedPath: "reel/DUJiyOEiHRR",
  },
  {
    canonicalUrl: "https://www.instagram.com/reel/DLskBSttm55/",
    embedPath: "reel/DLskBSttm55",
  },
] as const;

export function instagramEmbedSrc(embedPath: string): string {
  return `https://www.instagram.com/${embedPath}/embed`;
}
