"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import type { TreatmentCategory } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type TreatmentTabItem = {
  id: string;
  slug: string;
  category: TreatmentCategory;
  priceUSD?: number;
  title: string;
  description: string;
};

type TabLabels = {
  categories: {
    general: string;
    ortho: string;
    cosmetic: string;
    dental: string;
    mental: string;
  };
  priceLabel: string;
  viewTreatment: string;
};

type Props = {
  items: TreatmentTabItem[];
  labels: TabLabels;
};

const CATEGORY_ORDER: TreatmentCategory[] = [
  "general",
  "ortho",
  "cosmetic",
  "dental",
  "mental",
];

type CategoryId = TreatmentCategory;

function TreatmentItemGrid({
  items,
  labels,
}: {
  items: TreatmentTabItem[];
  labels: TabLabels;
}) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
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
                  <span className="text-xs font-semibold text-primary/70">
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
  );
}

export function TreatmentTabs({ items, labels }: Props) {
  const [activeTab, setActiveTab] = useState<CategoryId>("general");

  const categories: { id: CategoryId; label: string }[] = [
    ...CATEGORY_ORDER.map((id) => ({
      id,
      label: labels.categories[id],
    })),
  ];

  const filteredBy = (id: CategoryId) => items.filter((item) => item.category === id);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as CategoryId)}
      className="gap-8"
    >
      <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-px [scrollbar-width:thin]">
        <TabsList variant="underline" className="inline-flex min-w-min flex-nowrap justify-start gap-1 px-1">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="shrink-0 whitespace-nowrap"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {categories.map((category) => (
        <TabsContent key={category.id} value={category.id}>
          <TreatmentItemGrid items={filteredBy(category.id)} labels={labels} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
