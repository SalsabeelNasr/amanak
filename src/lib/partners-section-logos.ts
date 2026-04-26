/**
 * Static logo paths for partners page grids. Indices must stay aligned with
 * `partners.providersList.labs`, `partners.providersList.radiology`, and
 * `partners.pharmaciesList` in messages/ar.json and messages/en.json.
 */
export const PARTNER_LAB_LOGOS = [
  "/partners/al-mokhtabar.png",
  "/partners/al-borg.png",
  "/partners/alfa-scan.png",
] as const;

export const PARTNER_RADIOLOGY_LOGOS = [
  "/partners/alfa-scan.png",
  "/partners/cairo-scan.png",
  "/partners/misr-radiology-mrc.png",
] as const;

export const PARTNER_PHARMACY_LOGOS = [
  "/partners/el-ezaby.png",
  "/partners/seif.png",
  "/partners/el-tarshouby.png",
  "/partners/misr-pharmacies.png",
] as const;

export type ExternalPartnerLink = {
  href: string;
  label: string;
  logoSrc?: string | null;
};

export const ACCOMMODATION_PLATFORM_LINKS: readonly ExternalPartnerLink[] = [
  { href: "https://www.booking.com", label: "booking.com", logoSrc: "/partners/booking.png" },
  { href: "https://www.airbnb.com", label: "airbnb", logoSrc: "/partners/airbnb.png" },
  { href: "https://rentelly.com", label: "rentelly", logoSrc: "/partners/rentelly.png" },
  { href: "https://apps.apple.com/eg/app/maat-stays/id6739470981", label: "maat stays", logoSrc: "/partners/maat-stays.jpg" },
];

export const ACCOMMODATION_PROVIDER_LINKS: readonly ExternalPartnerLink[] = [
  { href: "https://www.xurustays.com", label: "xuru stays", logoSrc: "/partners/xuru-stays.svg" },
  { href: "https://birdnestlife.com", label: "birdnest", logoSrc: "/partners/birdnest.png" },
  { href: "https://www.kennahstays.com", label: "kennah", logoSrc: "/partners/kennah-stays.png" },
  { href: "https://brassbell.net", label: "brassbell", logoSrc: "/partners/brassbell.png" },
];
