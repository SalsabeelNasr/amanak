import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink, Globe2, ShieldCheck } from "lucide-react";

function websiteHostname(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return url;
  }
}

const ROW_IDS = [
  "andalusia",
  "saudiGerman",
  "asSalam",
  "cleopatra",
  "darAlFouad",
] as const;

type RowId = (typeof ROW_IDS)[number];

const HOSPITAL_IMAGES: Record<RowId, string> = {
  andalusia: "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400",
  saudiGerman: "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=400",
  asSalam: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg?auto=compress&cs=tinysrgb&w=400",
  cleopatra: "https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=400",
  darAlFouad: "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=400",
};

export async function AccreditedHospitals() {
  const t = await getTranslations("landing.accreditedHospitals");

  const rowCell = (
    id: RowId,
    key:
      | "facility"
      | "accreditations"
      | "departments"
      | "location"
      | "websiteUrl",
  ) => t(`rows.${id}.${key}` as Parameters<typeof t>[0]);

  return (
    <section className="border-t border-primary/20 bg-primary py-20 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16 items-start">
          {/* Left: Accreditations Focus (3/5) */}
          <div className="lg:col-span-3 space-y-10">
            <div className="space-y-4">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
                {t("title")}
              </h2>
              <p className="text-pretty text-lg text-primary-foreground/85 max-w-2xl leading-relaxed">
                {t("lead")}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="group relative rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.08] p-6 backdrop-blur-sm transition-all hover:bg-primary-foreground/[0.12]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-primary-foreground">
                  {t("gaharTitle")}
                </h3>
                <p className="text-sm leading-relaxed text-primary-foreground/80">
                  {t("gaharBody")}
                </p>
              </div>

              <div className="group relative rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.08] p-6 backdrop-blur-sm transition-all hover:bg-primary-foreground/[0.12]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground">
                  <Globe2 className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-primary-foreground">
                  {t("jciTitle")}
                </h3>
                <p className="text-sm leading-relaxed text-primary-foreground/80">
                  {t("jciBody")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/85">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-foreground" />
                <span>{t("trustBadge1")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/85">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-foreground" />
                <span>{t("trustBadge2")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/85">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-foreground" />
                <span>{t("trustBadge3")}</span>
              </div>
            </div>
          </div>

          {/* Right: Compact Hospital List (2/5) */}
          <div className="lg:col-span-2">
            <div className="relative rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-6 py-4 border-b border-border">
                <h3 className="text-sm font-semibold tracking-tight text-foreground/80">
                  {t("tableCaption")}
                </h3>
              </div>
              <div className="divide-y divide-border/40 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                {ROW_IDS.map((id) => (
                  <div
                    key={id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/20 group"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image
                        src={HOSPITAL_IMAGES[id]}
                        alt={rowCell(id, "facility")}
                        fill
                        className="object-cover transition-transform group-hover:scale-110"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-foreground text-sm truncate">
                          {rowCell(id, "facility")}
                        </h4>
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 font-bold bg-primary/10 text-primary border-none"
                        >
                          {rowCell(id, "accreditations")}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate font-medium">
                        {rowCell(id, "departments")} • {rowCell(id, "location")}
                      </p>
                      <a
                        href={rowCell(id, "websiteUrl")}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("officialSiteNewTab")}
                        aria-label={t("officialSiteAria", {
                          hospital: rowCell(id, "facility"),
                        })}
                        className="mt-1 inline-flex max-w-full items-center gap-1 text-[11px] font-medium text-primary hover:underline underline-offset-2"
                      >
                        <ExternalLink
                          className="size-3 shrink-0 opacity-80"
                          aria-hidden
                        />
                        <span className="truncate">
                          {websiteHostname(rowCell(id, "websiteUrl"))}
                        </span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
