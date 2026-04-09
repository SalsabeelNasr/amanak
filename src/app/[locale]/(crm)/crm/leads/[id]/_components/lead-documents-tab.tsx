"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { FileText, Image as ImageIcon, FlaskConical, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentUploadDialog } from "@/components/leads/document-upload-dialog";
import { InfiniteCardList } from "@/components/crm/infinite-card-list";
import { useSession } from "@/lib/mock-session";
import { cn } from "@/lib/utils";
import type { Lead, LeadDocument } from "@/types";

export type LeadDocumentsTabFilter = "all" | LeadDocument["status"];

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

export type LeadDocumentsTabRef = {
  openUpload: (type?: LeadDocument["type"]) => void;
};

type Props = {
  lead: Lead;
  onLeadUpdated: (lead: Lead) => void;
  filter: LeadDocumentsTabFilter;
  hideHeaderUpload?: boolean;
};

export const LeadDocumentsTab = forwardRef<LeadDocumentsTabRef, Props>(
  function LeadDocumentsTab(
    { lead, onLeadUpdated, filter, hideHeaderUpload = false },
    ref,
  ) {
    const t = useTranslations("crm");
    const tPortal = useTranslations("portal");
    const { session } = useSession();
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadDefaultType, setUploadDefaultType] = useState<
      LeadDocument["type"] | undefined
    >();

    const openUpload = useCallback((type?: LeadDocument["type"]) => {
      setUploadDefaultType(type);
      setUploadOpen(true);
    }, []);

    useImperativeHandle(ref, () => ({ openUpload }), [openUpload]);

    const missingMandatory = useMemo(
      () =>
        lead.documents.filter((d) => d.mandatory && d.status === "pending"),
      [lead.documents],
    );

    const filteredDocuments = useMemo(() => {
      if (filter === "all") return lead.documents;
      return lead.documents.filter((d) => d.status === filter);
    }, [lead.documents, filter]);

    const onUploaded = useCallback(
      (updated: Lead) => {
        onLeadUpdated(updated);
      },
      [onLeadUpdated],
    );

    const listBody = (
      <>
        {missingMandatory.length > 0 ? (
          <div
            className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm"
            role="status"
          >
            <p className="font-semibold text-foreground">
              {tPortal("missingRequiredTitle", { count: missingMandatory.length })}
            </p>
            <p className="mt-1 text-muted-foreground">{tPortal("missingRequiredHint")}</p>
            <ul className="mt-2 list-inside list-disc font-medium text-foreground/90">
              {missingMandatory.slice(0, 5).map((d) => (
                <li key={d.id}>{d.name}</li>
              ))}
            </ul>
            {missingMandatory.length > 5 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {tPortal("moreMissingCount", { count: missingMandatory.length - 5 })}
              </p>
            ) : null}
          </div>
        ) : null}

        <InfiniteCardList
          key={filter}
          items={filteredDocuments}
          getItemKey={(doc) => doc.id}
          initialVisible={10}
          pageSize={10}
          empty={
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-3 size-10 text-muted-foreground/20" aria-hidden />
              <p className="text-xs font-medium text-muted-foreground">
                {filter === "all" ? tPortal("noDocs") : t("docEmptyFiltered")}
              </p>
            </div>
          }
          renderItem={(doc) => {
            const Icon = iconFor(doc.type);
            return (
              <div className={cnDocRow(doc.mandatory && doc.status === "pending")}>
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/50">
                    {doc.status === "uploaded" || doc.status === "verified" ? (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Opening ${doc.name}...`);
                        }}
                        className="flex size-full items-center justify-center"
                        title={tPortal("viewFile")}
                      >
                        <Icon
                          className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                          aria-hidden
                        />
                      </a>
                    ) : (
                      <Icon
                        className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    {doc.status === "uploaded" || doc.status === "verified" ? (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          alert(`Opening ${doc.name}...`);
                        }}
                        className="block truncate text-sm font-bold text-foreground/90 hover:text-primary transition-colors"
                        title={tPortal("viewFile")}
                      >
                        {doc.name}
                      </a>
                    ) : (
                      <span className="block truncate text-sm font-bold text-foreground/90">
                        {doc.name}
                      </span>
                    )}
                    <span className="amanak-app-field-label mt-0.5 block">
                      {tPortal(`docType_${doc.type}`)}
                      {doc.mandatory ? ` · ${tPortal("mandatory")}` : ` · ${tPortal("optional")}`}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  {doc.status === "verified" ? (
                    <Badge className="border-transparent bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      {tPortal("docVerified")}
                    </Badge>
                  ) : null}
                  {doc.status === "uploaded" ? (
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {tPortal("docUploaded")}
                    </Badge>
                  ) : null}
                  {doc.status === "pending" ? (
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                      <Badge variant="outline" className="px-2.5 py-0.5 amanak-app-field-label">
                        {tPortal("docPending")}
                      </Badge>
                      {session.isAuthenticated ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-xs font-medium"
                          onClick={() => openUpload(doc.type)}
                        >
                          {tPortal("uploadDoc")}
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          }}
        />
      </>
    );

    return (
      <div className="space-y-6">
        {hideHeaderUpload ? (
          <div className="space-y-4">{listBody}</div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col gap-4 border-b border-border bg-muted/30 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="size-4" aria-hidden />
                </div>
                <h2 className="amanak-app-panel-title">{tPortal("documents")}</h2>
              </div>
              {session.isAuthenticated ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 rounded-xl text-sm font-semibold shadow-md"
                  onClick={() => openUpload(undefined)}
                >
                  {t("docUpload")}
                </Button>
              ) : null}
            </div>

            <div className="space-y-4 p-6">{listBody}</div>
          </section>
        )}

        <DocumentUploadDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          leadId={lead.id}
          uploadedByUserId={session.user?.id}
          defaultType={uploadDefaultType}
          onUploaded={onUploaded}
        />
      </div>
    );
  },
);

function cnDocRow(isMissing: boolean) {
  return cn(
    "group flex flex-col gap-3 rounded-xl border p-4 shadow-sm ring-1 ring-black/5 transition-all sm:flex-row sm:items-start sm:justify-between",
    isMissing
      ? "border-amber-500/35 bg-amber-500/[0.06] hover:border-amber-500/45"
      : "border-border bg-card hover:bg-muted/5",
  );
}

LeadDocumentsTab.displayName = "LeadDocumentsTab";
