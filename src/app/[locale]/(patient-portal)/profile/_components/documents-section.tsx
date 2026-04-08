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
    <div className="grid gap-4 sm:grid-cols-2">
      {docs.length === 0 && (
        <p className="text-sm text-muted-foreground col-span-full text-center py-8 bg-card rounded-2xl border border-dashed border-border">
          {t("noDocs")}
        </p>
      )}
      {docs.map((doc) => {
        const Icon = iconFor(doc.type);
        return (
          <div
            key={doc.id}
            className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-4 hover:shadow-md hover:border-primary/20 transition-all duration-200"
          >
            <div className="size-12 shrink-0 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Icon className="size-6 text-primary/60 group-hover:text-primary transition-colors" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {doc.name}
              </p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-0.5">
                {doc.mandatory ? t("mandatory") : t("optional")}
              </p>
            </div>
            <div className="shrink-0">
              {doc.status === "verified" && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-transparent text-[10px] px-2 py-0">
                  {t("docVerified")}
                </Badge>
              )}
              {doc.status === "uploaded" && (
                <Badge variant="secondary" className="text-[10px] px-2 py-0">
                  {t("docUploaded")}
                </Badge>
              )}
              {doc.status === "pending" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => handleUpload(doc.id)}
                >
                  {t("uploadDoc")}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
