import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Globe2, ShieldCheck } from "lucide-react";

const ROW_IDS = [
  "andalusia",
  "saudiGerman",
  "asSalam",
  "cleopatra",
  "internationalEye",
  "maghrabi",
  "darAlFouad",
] as const;

type RowId = (typeof ROW_IDS)[number];

const HOSPITAL_IMAGES: Record<RowId, string> = {
  andalusia: "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400",
  saudiGerman: "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=400",
  asSalam: "https://images.pexels.com/photos/40568/medical-appointment-doctor-healthcare-40568.jpeg?auto=compress&cs=tinysrgb&w=400",
  cleopatra: "https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=400",
  internationalEye: "https://images.pexels.com/photos/3844581/pexels-photo-3844581.jpeg?auto=compress&cs=tinysrgb&w=400",
  maghrabi: "https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=400",
  darAlFouad: "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg?auto=compress&cs=tinysrgb&w=400",
};

export async function AccreditedHospitals() {
  const t = await getTranslations("landing.accreditedHospitals");

  const rowCell = (
    id: RowId,
    key: "facility" | "accreditations" | "departments" | "location",
  ) => t(`rows.${id}.${key}` as Parameters<typeof t>[0]);

  return (
    <section className="bg-background py-20 sm:py-24 border-t border-border/40 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5 lg:gap-16 items-start">
          {/* Left: Accreditations Focus (3/5) */}
          <div className="lg:col-span-3 space-y-10">
            <div className="space-y-4">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t("title")}
              </h2>
              <p className="text-pretty text-lg text-muted-foreground max-w-2xl">
                {t("lead")}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="group relative rounded-2xl border border-primary/10 bg-primary/5 p-6 transition-all hover:bg-primary/[0.08]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {t("gaharTitle")}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {t("gaharBody")}
                </p>
              </div>

              <div className="group relative rounded-2xl border border-primary/10 bg-primary/5 p-6 transition-all hover:bg-primary/[0.08]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {t("jciTitle")}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {t("jciBody")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center pt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Patient Safety First</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>ISQua Accredited Standards</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Rigorous Clinical Audits</span>
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
