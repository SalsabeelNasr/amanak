import { Badge } from "@/components/ui/badge";
import { getStatusLabel } from "@/lib/services/state-machine.service";
import type { LeadStatus } from "@/types";
import { cn } from "@/lib/utils";
import type { LangKey } from "./lang";

/** Compact table / list row pill (hover states). */
export function statusTableBadgeClass(status: LeadStatus): string {
  switch (status) {
    case "rejected":
      return "bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20";
    case "in_treatment":
    case "post_treatment":
    case "specialized_doctor_assigned":
    case "order_created":
      return "bg-primary text-primary-foreground border-transparent hover:bg-primary/90";
    case "approved":
    case "quotation_generated":
    case "contract_sent":
    case "customer_accepted":
    case "payment_verified":
      return "bg-primary/10 text-primary border-transparent hover:bg-primary/20";
    default:
      return "bg-muted text-muted-foreground border-transparent hover:bg-muted/80";
  }
}

/** Overview / header status chip (no hover affordance). */
export function statusOverviewBadgeClass(status: LeadStatus): string {
  switch (status) {
    case "rejected":
      return "bg-destructive/10 text-destructive border-transparent";
    case "in_treatment":
    case "post_treatment":
    case "specialized_doctor_assigned":
    case "order_created":
      return "bg-primary text-primary-foreground border-transparent shadow-sm";
    case "approved":
    case "quotation_generated":
    case "contract_sent":
    case "customer_accepted":
    case "payment_verified":
      return "bg-primary/10 text-primary border-transparent shadow-sm";
    default:
      return "bg-muted text-muted-foreground border-transparent shadow-sm";
  }
}

type StatusBadgeProps = {
  status: LeadStatus;
  langKey: LangKey;
  variant?: "table" | "overview";
  className?: string;
};

export function StatusBadge({
  status,
  langKey,
  variant = "table",
  className,
}: StatusBadgeProps) {
  const label = getStatusLabel(status)[langKey];
  const variantClass =
    variant === "overview"
      ? statusOverviewBadgeClass(status)
      : statusTableBadgeClass(status);
  return (
    <Badge
      className={cn(
        variant === "table"
          ? "text-[10px] px-2 py-0.5 font-bold shadow-sm"
          : "px-2.5 py-1 text-sm font-bold shadow-sm",
        variantClass,
        className,
      )}
    >
      {label}
    </Badge>
  );
}
