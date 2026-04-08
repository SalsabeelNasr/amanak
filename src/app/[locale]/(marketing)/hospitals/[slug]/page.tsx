import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getHospitalBySlug } from "@/lib/api/hospitals";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = { params: Promise<{ slug: string }> };

export default async function HospitalDetailPage({ params }: Props) {
  const { slug } = await params;
  const [hospital, t, tAll] = await Promise.all([
    getHospitalBySlug(slug),
    getTranslations("hospitals"),
    getTranslations(),
  ]);

  if (!hospital) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-foreground">{hospital.name}</h1>
        <p className="text-muted-foreground">{tAll(hospital.descriptionKey)}</p>
      </div>
      <Card className="border-border">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-lg font-semibold text-foreground">{t("specialties")}</h2>
          <Separator />
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {hospital.specialtyKeys.map((key) => (
              <li key={key}>{tAll(key)}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
