export type Hospital = {
  id: string;
  slug: string;
  name: string;
  destinationSlug: string;
  specialtyKeys: string[];
  descriptionKey: string;
};

export type Doctor = {
  id: string;
  nameKey: string;
  titleKey: string;
  image?: string;
  instagram?: string;
};

export type Treatment = {
  id: string;
  slug: string;
  sortOrder: number;
  category: "general" | "ortho" | "cosmetic";
  titleKey: string;
  descriptionKey: string;
  bodyKey: string;
  priceUSD?: number;
  doctorsKey?: string;
  doctorIds?: string[];
  hospitalsKey?: string;
  techniquesKey?: string;
  successRateKey?: string;
  videoUrlKey?: string;
};

export type InquiryPayload = {
  fullName: string;
  phone: string;
  email?: string;
  treatmentSlug?: string;
  message: string;
};
