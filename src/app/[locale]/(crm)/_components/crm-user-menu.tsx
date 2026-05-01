"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDown, Languages, LogOut } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MockUser } from "@/types";

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts.at(-1)![0]!).toUpperCase();
}

type CrmUserMenuProps = {
  user: MockUser;
  onLogout: () => void;
};

export function CrmUserMenu({ user, onLogout }: CrmUserMenuProps) {
  const tCrm = useTranslations("crm");
  const tAuth = useTranslations("auth");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const targetLocale = locale === "ar" ? "en" : "ar";
  const languageLabel =
    targetLocale === "en" ? tNav("locale.en") : tNav("locale.ar");

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        type="button"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "h-auto w-full justify-start gap-2 px-2 py-2 text-sidebar-foreground touch-manipulation",
        )}
        aria-label={tCrm("userMenuAria")}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
          {userInitials(user.name)}
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block truncate text-sm font-medium leading-tight text-sidebar-foreground">
            {user.name}
          </span>
          <span className="block truncate text-xs text-sidebar-foreground/60">{user.email}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner
          side="top"
          align="start"
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
