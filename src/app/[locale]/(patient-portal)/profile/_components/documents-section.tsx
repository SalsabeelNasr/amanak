"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Image as ImageIcon, FlaskConical, BookOpen, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentUploadDialog } from "@/components/leads/document-upload-dialog";
import { useSession } from "@/lib/mock-session";
import { cn } from "@/lib/utils";
import type { Lead, LeadDocument } from "@/types";

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
  leadId,
  initialDocuments,
}: {
  leadId: string;
  initialDocuments: LeadDocument[];
}) {
  const t = useTranslations("portal");
  const { session } = useSession();
  const [docs, setDocs] = useState<LeadDocument[]>(initialDocuments);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDefaultType, setUploadDefaultType] = useState<LeadDocument["type"] | undefined>();

  const missingMandatory = useMemo(
    () => docs.filter((d) => d.mandatory && d.status === "pending"),
    [docs],
  );

  const openUpload = useCallback((type?: LeadDocument["type"]) => {
    setUploadDefaultType(type);
    setUploadOpen(true);
  }, []);

  const onUploaded = useCallback((updated: Lead) => {
    setDocs(updated.documents);
  }, []);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border/50 bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-4" aria-hidden />
            </div>
            <h2 className="amanak-app-panel-title text-base">{t("documents")}</h2>
          </div>
          <Button
            type="button"
            size="sm"
            className="h-9 gap-2 rounded-xl text-sm font-semibold shadow-sm"
            onClick={() => openUpload(undefined)}
          >
            <Upload className="size-3.5" aria-hidden />
            {t("uploadFileButton")}
          </Button>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          {missingMandatory.length > 0 ? (
            <div
              className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm"
              role="status"
            >
              <p className="font-semibold text-foreground">
                {t("missingRequiredTitle", { count: missingMandatory.length })}
              </p>
              <p className="mt-1 text-muted-foreground">{t("missingRequiredHint")}</p>
              <ul className="mt-2 list-inside list-disc font-medium text-foreground/90">
                {missingMandatory.slice(0, 5).map((d) => (
                  <li key={d.id}>{d.name}</li>
                ))}
              </ul>
              {missingMandatory.length > 5 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("moreMissingCount", { count: missingMandatory.length - 5 })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {docs.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8 rounded-2xl border border-dashed border-border bg-muted/10">
                {t("noDocs")}
              </p>
            )}
            {docs.map((doc) => {
              const Icon = iconFor(doc.type);
              return (
                <div
                  key={doc.id}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all duration-200 hover:shadow-md",
                    doc.mandatory && doc.status === "pending"
                      ? "border-amber-500/35 hover:border-amber-500/50"
                      : "border-border/50 hover:border-primary/20",
                  )}
                >
                    <div className="size-12 shrink-0 rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      {doc.status === "uploaded" || doc.status === "verified" ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Opening ${doc.name}...`);
                          }}
                          className="flex size-full items-center justify-center"
                          title={t("viewFile")}
                        >
                          <Icon className="size-6 text-primary/60 group-hover:text-primary transition-colors" aria-hidden />
                        </a>
                      ) : (
                        <Icon className="size-6 text-primary/60 group-hover:text-primary transition-colors" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      {doc.status === "uploaded" || doc.status === "verified" ? (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Opening ${doc.name}...`);
                          }}
                          className="truncate text-sm font-bold text-foreground hover:text-primary transition-colors"
                          title={t("viewFile")}
                        >
                          {doc.name}
                        </a>
                      ) : (
                        <p className="truncate text-sm font-bold text-foreground">{doc.name}</p>
                      )}
                      <p className="amanak-app-field-label mt-0.5">
                        {t(`docType_${doc.type}`)} · {doc.mandatory ? t("mandatory") : t("optional")}
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
                        className="h-8 text-xs font-medium rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                        onClick={() => openUpload(doc.type)}
                      >
                        {t("uploadDoc")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        leadId={leadId}
        uploadedByUserId={session.user?.id}
        defaultType={uploadDefaultType}
        onUploaded={onUploaded}
      />
    </div>
  );
}
