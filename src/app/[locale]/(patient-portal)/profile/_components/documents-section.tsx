"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Image as ImageIcon, FlaskConical, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LeadDocument } from "@/types";

function iconFor(type: LeadDocument["type"]) {
  switch (type) {
    case "xray":
      return ImageIcon;
    case "lab_result":
      return FlaskConical;
    case "passport":
    case "visa":
      return BookOpen;
    default:
      return FileText;
  }
}

export function DocumentsSection({
  initialDocuments,
}: {
  initialDocuments: LeadDocument[];
}) {
  const t = useTranslations("portal");
  const [docs, setDocs] = useState<LeadDocument[]>(initialDocuments);

  function handleUpload(id: string) {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "uploaded",
              uploadedAt: new Date().toISOString(),
              uploadedBy: "patient_1",
            }
          : d,
      ),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("documents")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {docs.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noDocs")}</p>
        )}
        {docs.map((doc) => {
          const Icon = iconFor(doc.type);
          return (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-md border border-border/60 bg-card p-3"
            >
              <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {doc.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {doc.mandatory ? t("mandatory") : t("optional")}
                </p>
              </div>
              {doc.status === "verified" && (
                <Badge variant="default">{t("docVerified")}</Badge>
              )}
              {doc.status === "uploaded" && (
                <Badge variant="secondary">{t("docUploaded")}</Badge>
              )}
              {doc.status === "pending" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpload(doc.id)}
                >
                  {t("uploadDoc")}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
