"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TreatmentTabItem = {
  id: string;
  slug: string;
  category: "general" | "ortho" | "cosmetic";
  priceUSD?: number;
  title: string;
  description: string;
};

type TabLabels = {
  categories: {
    all: string;
    general: string;
    ortho: string;
    cosmetic: string;
  };
  priceLabel: string;
  viewTreatment: string;
};

type Props = {
  items: TreatmentTabItem[];
  labels: TabLabels;
};

export function TreatmentTabs({ items, labels }: Props) {
  const [activeTab, setActiveTab] = useState<
    "all" | "general" | "ortho" | "cosmetic"
  >("all");

  const filteredItems =
    activeTab === "all"
      ? items
      : items.filter((item) => item.category === activeTab);

  const categories = [
    { id: "all" as const, label: labels.categories.all },
    { id: "general" as const, label: labels.categories.general },
    { id: "ortho" as const, label: labels.categories.ortho },
    { id: "cosmetic" as const, label: labels.categories.cosmetic },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveTab(category.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-all",
              activeTab === category.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item, index) => (
          <li key={item.id} className="group">
            <article className="flex h-full flex-col rounded-3xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/20 hover:shadow-xl">
              <div className="mb-6 flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                  {index + 1}
                </span>
                <h2 className="text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </h2>
              </div>

              <p className="mb-8 grow text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>

              <div className="space-y-6">
                {item.priceUSD != null && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                      {labels.priceLabel}
                    </span>
                    <span className="text-2xl font-black text-foreground">
                      ${item.priceUSD.toLocaleString()}
                    </span>
                  </div>
                )}

                <Link
                  href={`${ROUTES.treatments}/${item.slug}`}
                  className={cn(
                    buttonVariants({
                      variant: "ghost",
                      size: "lg",
                    }),
                    "w-full rounded-full border border-transparent bg-primary/10 font-bold text-primary shadow-sm transition-all hover:bg-primary/20 hover:text-primary group-hover:shadow-md",
                  )}
                  prefetch={false}
                >
                  {labels.viewTreatment}
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
