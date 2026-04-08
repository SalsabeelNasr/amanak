"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { JourneyTimeline } from "@/components/portal/journey-timeline";
import {
  applyTransition,
  getAvailableTransitions,
  getStatusLabel,
  isTerminalState,
} from "@/lib/services/state-machine.service";
import { updateLead } from "@/lib/api/leads";
import { useSession } from "@/lib/mock-session";
import type { Lead, StateTransition } from "@/types";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadDetail({ initialLead }: { initialLead: Lead }) {
  const t = useTranslations("crm");
  const tPortal = useTranslations("portal");
  const locale = useLocale();
  const langKey = locale === "ar" ? "ar" : "en";
  const { session } = useSession();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [pendingTransition, setPendingTransition] =
    useState<StateTransition | null>(null);
  const [note, setNote] = useState("");
  const [successFlash, setSuccessFlash] = useState(false);

  const availableTransitions = useMemo(
    () =>
      session.isAuthenticated
        ? getAvailableTransitions(lead.status, session.user.role)
        : [],
    [lead.status, session],
  );

  useEffect(() => {
    if (!successFlash) return;
    const timer = setTimeout(() => setSuccessFlash(false), 2000);
    return () => clearTimeout(timer);
  }, [successFlash]);

  async function handleConfirm() {
    if (!pendingTransition || !session.isAuthenticated) return;
    if (pendingTransition.requiresNote && !note.trim()) return;
    try {
      const updated = applyTransition(
        lead,
        pendingTransition.action,
        session.user,
        note.trim() || undefined,
      );
      setLead(updated);
      setPendingTransition(null);
      setNote("");
      setSuccessFlash(true);
      void updateLead(lead.id, updated);
    } catch (err) {
      console.error(err);
    }
  }

  const activeQuotation = lead.activeQuotationId
    ? lead.quotations.find((q) => q.id === lead.activeQuotationId)
    : undefined;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">
          {lead.patientName}
        </h1>
        <Badge variant="secondary" className="uppercase">
          {lead.clientType}
        </Badge>
        <Badge variant="default">{getStatusLabel(lead.status)[langKey]}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{tPortal("personalInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">{tPortal("phone")}</p>
                <p className="font-medium text-foreground">{lead.patientPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {tPortal("country")}
                </p>
                <p className="font-medium text-foreground">
                  {lead.patientCountry}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("treatment")}</p>
                <p className="font-medium text-foreground">
                  {lead.treatmentSlug}
                </p>
              </div>
              {lead.assignedCsId && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("assignedCs")}
                  </p>
                  <p className="font-medium text-foreground">
                    {lead.assignedCsId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tPortal("documents")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.documents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {tPortal("noDocs")}
                </p>
              )}
              {lead.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{doc.name}</span>
                  {doc.status === "verified" && (
                    <Badge variant="default">{tPortal("docVerified")}</Badge>
                  )}
                  {doc.status === "uploaded" && (
                    <Badge variant="secondary">{tPortal("docUploaded")}</Badge>
                  )}
                  {doc.status === "pending" && (
                    <Badge
                      className={cn(
                        "border-transparent bg-muted text-muted-foreground",
                      )}
                    >
                      {tPortal("docPending")}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{tPortal("journey")}</CardTitle>
            </CardHeader>
            <CardContent>
              <JourneyTimeline lead={lead} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("statusHistory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="max-h-64 space-y-3 overflow-y-auto border-s-2 border-border ps-4">
                {[...lead.statusHistory].reverse().map((entry, idx) => (
                  <li key={idx} className="text-xs">
                    <p className="font-medium text-foreground">
                      {getStatusLabel(entry.from)[langKey]} →{" "}
                      {getStatusLabel(entry.to)[langKey]}
                    </p>
                    <p className="text-muted-foreground">
                      {entry.actorRole} · {formatDateTime(entry.timestamp, locale)}
                    </p>
                    {entry.note && (
                      <p className="mt-1 rounded bg-muted px-2 py-1 text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                  </li>
                ))}
                {lead.statusHistory.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {t("noHistory")}
                  </p>
                )}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("availableActions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {successFlash && (
                <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
                  {t("updated")}
                </p>
              )}
              {isTerminalState(lead.status) || availableTransitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noActions")}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableTransitions.map((tr) => (
                    <Button
                      key={tr.action + tr.from}
                      type="button"
                      size="sm"
                      variant={
                        pendingTransition?.action === tr.action
                          ? "default"
                          : "outline"
                      }
                      onClick={() => {
                        setPendingTransition(tr);
                        setNote("");
                      }}
                    >
                      {tr.label[langKey]}
                    </Button>
                  ))}
                </div>
              )}

              {pendingTransition && (
                <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {pendingTransition.label[langKey]}
                  </p>
                  {pendingTransition.requiresNote && (
                    <>
                      <Label htmlFor="action-note">{t("addNote")}</Label>
                      <textarea
                        id="action-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="min-h-16 w-full rounded-md border border-border bg-card p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConfirm}
                      disabled={
                        pendingTransition.requiresNote && !note.trim()
                      }
                    >
                      {t("confirm")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPendingTransition(null);
                        setNote("");
                      }}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {activeQuotation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t("activeQuotation")}</span>
                  <Badge variant="default" className="uppercase">
                    {activeQuotation.packageTier}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between font-semibold">
                  <span>{tPortal("total")}</span>
                  <span className="tabular-nums text-primary">
                    ${activeQuotation.totalUSD.toLocaleString()}
                  </span>
                </div>
                <Badge variant="secondary">{activeQuotation.status}</Badge>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
