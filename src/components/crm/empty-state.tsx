import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 bg-card rounded-xl border border-dashed border-border",
        className,
      )}
    >
      <Icon className="size-12 text-muted-foreground/20 mb-4" aria-hidden />
      <p className="text-muted-foreground font-medium">{title}</p>
      {description ? (
        <p className="mt-1 text-center text-sm text-muted-foreground/90">{description}</p>
      ) : null}
    </div>
  );
}
