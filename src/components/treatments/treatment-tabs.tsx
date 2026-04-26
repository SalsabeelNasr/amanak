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

const CATEGORY_ORDER = [
  "general",
  "ortho",
  "cosmetic",
  "dental",
  "mental",
] as const satisfies readonly TreatmentCategory[];

type TreatmentTabCategory = (typeof CATEGORY_ORDER)[number];

type TabLabels = {
  categories: Record<TreatmentTabCategory, string>;
  priceLabel: string;
  viewTreatment: string;
};

type Props = {
  items: TreatmentTabItem[];
  labels: TabLabels;
};

type CategoryId = TreatmentTabCategory;

function TreatmentItemGrid({
  items,
  labels,
}: {
  items: TreatmentTabItem[];
  labels: TabLabels;
}) {
  return (
    <ul className="grid min-w-0 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.id} className="group min-w-0">
          <article className="flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all sm:rounded-3xl sm:p-6 lg:p-8 hover:border-primary/20 hover:shadow-xl">
            <div className="mb-5 flex min-w-0 items-start gap-3 sm:mb-6 sm:items-center sm:gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
                {index + 1}
              </span>
              <h2 className="min-w-0 text-balance text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                {item.title}
              </h2>
            </div>

            <p className="mb-6 grow text-sm leading-relaxed text-muted-foreground sm:mb-8">
              {item.description}
            </p>

            <div className="space-y-5 sm:space-y-6">
              {item.priceUSD != null && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-primary/70">
                    {labels.priceLabel}
                  </span>
                  <span className="text-xl font-black text-foreground sm:text-2xl">
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
      className="mt-0 gap-4"
    >
      <div className="-mx-4 mt-0 overflow-x-auto overscroll-x-contain px-4 pb-px [scrollbar-width:thin] sm:-mx-1 sm:px-1">
        <TabsList variant="underline" className="inline-flex min-w-min flex-nowrap justify-start gap-1">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className={cn(
                "shrink-0 whitespace-nowrap",
                "text-sm sm:text-base lg:text-xl xl:text-2xl",
                "lg:min-h-12 lg:px-5 lg:py-3 xl:min-h-14 xl:px-6 xl:py-3.5",
              )}
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {categories.map((category) => (
        <TabsContent
          key={category.id}
          value={category.id}
          className="mt-0 flex-none outline-none"
        >
          <TreatmentItemGrid items={filteredBy(category.id)} labels={labels} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
