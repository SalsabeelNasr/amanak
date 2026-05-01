"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

export type PatientsPageFiltersProps = {
  initialQ: string;
  initialClientType: string;
  initialPortal: string;
  initialOpen: boolean;
};

function buildQuery(params: {
  q: string;
  clientType: string;
  portal: string;
  open: boolean;
}): string {
  const sp = new URLSearchParams();
  const trimmed = params.q.trim();
  if (trimmed) sp.set("q", trimmed);
  if (params.clientType) sp.set("clientType", params.clientType);
  if (params.portal) sp.set("portal", params.portal);
  if (params.open) sp.set("open", "1");
  return sp.toString();
}

export function PatientsPageFilters({
  initialQ,
  initialClientType,
  initialPortal,
  initialOpen,
}: PatientsPageFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("crm.patientsPage");

  const [q, setQ] = useState(initialQ);
  const [clientType, setClientType] = useState(initialClientType);
  const [portal, setPortal] = useState(initialPortal);
  const [open, setOpen] = useState(initialOpen);

  const latest = useRef({ q, clientType, portal, open });
  latest.current = { q, clientType, portal, open };

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitFromRef = useCallback(() => {
    const { q: qv, clientType: ct, portal: po, open: op } = latest.current;
    const qs = buildQuery({ q: qv, clientType: ct, portal: po, open: op });
    const href = qs ? `${pathname}?${qs}` : pathname;
    router.replace(href, { scroll: false });
  }, [pathname, router]);

  useEffect(
    () => () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    },
    [],
  );

  useEffect(() => {
    if (searchInputRef.current === document.activeElement) return;
    setQ(initialQ);
    setClientType(initialClientType);
    setPortal(initialPortal);
    setOpen(initialOpen);
    latest.current = {
      q: initialQ,
      clientType: initialClientType,
      portal: initialPortal,
      open: initialOpen,
    };
  }, [initialQ, initialClientType, initialPortal, initialOpen]);

  const scheduleSearchCommit = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      commitFromRef();
    }, 320);
  }, [commitFromRef]);

  const flushSearchCommit = useCallback(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    commitFromRef();
  }, [commitFromRef]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-muted-foreground">
        {t("filterSearch")}
        <input
          ref={searchInputRef}
          name="q"
          value={q}
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            latest.current = { ...latest.current, q: v };
            scheduleSearchCommit();
          }}
          onBlur={flushSearchCommit}
          placeholder={t("filterSearchPlaceholder")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        />
      </label>
      <label className="flex min-w-[8rem] flex-col gap-1 text-xs font-medium text-muted-foreground">
        {t("filterClientType")}
        <select
          name="clientType"
          value={clientType}
          onChange={(e) => {
            const v = e.target.value;
            setClientType(v);
            latest.current = { ...latest.current, clientType: v };
            commitFromRef();
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="">{t("filterAny")}</option>
          <option value="b2c">B2C</option>
          <option value="b2b">B2B</option>
          <option value="g2b">G2B</option>
        </select>
      </label>
      <label className="flex min-w-[10rem] flex-col gap-1 text-xs font-medium text-muted-foreground">
        {t("filterPortal")}
        <select
          name="portal"
          value={portal}
          onChange={(e) => {
            const v = e.target.value;
            setPortal(v);
            latest.current = { ...latest.current, portal: v };
            commitFromRef();
          }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          <option value="">{t("filterAny")}</option>
          <option value="1">{t("filterPortalYes")}</option>
          <option value="0">{t("filterPortalNo")}</option>
        </select>
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="open"
          value="1"
          checked={open}
          onChange={(e) => {
            const v = e.target.checked;
            setOpen(v);
            latest.current = { ...latest.current, open: v };
            commitFromRef();
          }}
          className="size-4 rounded border-input"
        />
        {t("filterHasOpenRequests")}
      </label>
    </div>
  );
}
