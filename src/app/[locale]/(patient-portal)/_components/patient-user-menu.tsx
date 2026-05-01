"use client";

import { Menu } from "@base-ui/react/menu";
import { Check, ChevronDown, Languages, LogOut, UserRound, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { MockUser } from "@/types";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts.at(-1)![0]!).toUpperCase();
}

export function PatientUserMenu({
  user,
  activePatientId,
  patientOptions,
  onSwitchPatient,
  onLogout,
}: {
  user: MockUser;
  activePatientId: string;
  patientOptions: MockUser[];
  onSwitchPatient: (nextPatientUser: MockUser) => void;
  onLogout: () => void;
}) {
  const tAuth = useTranslations("auth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const targetLocale = locale === "ar" ? "en" : "ar";
  const languageLabel =
    targetLocale === "en" ? tNav("locale.en") : tNav("locale.ar");

  const profileHref = `${ROUTES.patientProfile}?patient=${encodeURIComponent(activePatientId)}`;

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        type="button"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-auto gap-2 px-2 py-1.5 text-foreground",
        )}
        aria-label={tAuth("userMenuAria")}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {userInitials(user.name)}
        </span>
        <span className="hidden min-w-0 text-start sm:block">
          <span className="block truncate text-sm font-medium leading-tight">
            {user.name}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-50 outline-none"
        >
          <Menu.Popup
            className={cn(
              "min-w-[12.5rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg",
              "origin-[var(--transform-origin)]",
            )}
          >
            <Menu.Item
              className={cn(
                "flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none",
                "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
              )}
              onClick={() => router.push(profileHref)}
            >
              <UserRound className="size-4 shrink-0 opacity-80" aria-hidden />
              <span>{tAuth("myProfile")}</span>
            </Menu.Item>

            <Menu.Separator className="my-1 h-px bg-border" />

            <div className="px-2.5 py-1.5 text-[11px] font-semibold tracking-tight text-muted-foreground">
              {tAuth("switchDemoPatient")}
            </div>
            {patientOptions.map((opt) => {
              const selected = opt.id === activePatientId;
              return (
                <Menu.Item
                  key={opt.id}
                  className={cn(
                    "flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none",
                    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                  )}
                  onClick={() => onSwitchPatient(opt)}
                >
                  <Users className="size-4 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{opt.name}</span>
                  {selected ? <Check className="size-3.5 shrink-0 text-primary" aria-hidden /> : null}
                </Menu.Item>
              );
            })}

            <Menu.Item
              className={cn(
                "flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none",
                "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
              )}
              onClick={() => {
                router.replace(pathname, { locale: targetLocale });
              }}
            >
              <Languages className="size-4 shrink-0 opacity-80" aria-hidden />
              <span>{languageLabel}</span>
            </Menu.Item>

            <Menu.Separator className="my-1 h-px bg-border" />

            <Menu.Item
              className={cn(
                "flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none",
                "text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive",
              )}
              onClick={onLogout}
            >
              <LogOut className="size-4 shrink-0 opacity-80" aria-hidden />
              {tAuth("logout")}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
