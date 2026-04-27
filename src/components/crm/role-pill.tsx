"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ActorRole } from "@/types";
import { cn } from "@/lib/utils";

type RolePillProps = {
  role: ActorRole;
  className?: string;
};

const ROLE_VARIANT: Record<ActorRole, string> = {
  admin: "border-border/60 bg-muted/50 text-foreground",
  cs: "border-primary/20 bg-primary/5 text-primary",
  consultant_doctor: "border-primary/20 bg-primary/10 text-primary",
  specialized_doctor: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  patient: "border-border/60 bg-card text-muted-foreground",
};

export function RolePill({ role, className }: RolePillProps) {
  const t = useTranslations("crm");
  const label = t(
    `actorRoles.${role}` as
      | "actorRoles.admin"
      | "actorRoles.cs"
      | "actorRoles.consultant_doctor"
      | "actorRoles.specialized_doctor"
      | "actorRoles.patient",
  );
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", ROLE_VARIANT[role], className)}
    >
      {label}
    </Badge>
  );
}
