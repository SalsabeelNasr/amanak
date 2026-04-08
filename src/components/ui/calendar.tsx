"use client";

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import * as React from "react";
import { DayPicker as DayPickerPrimitive } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: React.ComponentProps<typeof DayPickerPrimitive>) {
  return (
    <DayPickerPrimitive
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        /* Spread first so merged entries below win; spreading last overwrote defaults (e.g. nav lost absolute layout). */
        ...classNames,
        root: cn("w-fit", classNames?.root),
        months: cn("relative flex flex-col gap-4 sm:flex-row", classNames?.months),
        month: cn("flex w-full flex-col gap-4", classNames?.month),
        month_caption: cn(
          "relative flex h-9 w-full items-center justify-center px-9",
          classNames?.month_caption,
        ),
        caption_label: cn("text-sm font-medium", classNames?.caption_label),
        nav: cn(
          "absolute flex w-full items-center justify-between gap-1 inset-x-0 top-0",
          classNames?.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 shrink-0 p-0 aria-disabled:opacity-50",
          classNames?.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 shrink-0 p-0 aria-disabled:opacity-50",
          classNames?.button_next,
        ),
        month_grid: cn("w-full border-collapse", classNames?.month_grid),
        weekdays: cn("flex", classNames?.weekdays),
        weekday: cn(
          "flex-1 text-center text-[0.8rem] font-normal text-muted-foreground select-none rounded-md",
          classNames?.weekday,
        ),
        week: cn("mt-2 flex w-full", classNames?.week),
        day: cn(
          "relative flex-1 p-0 text-center text-sm focus-within:relative focus-within:z-20",
          classNames?.day,
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
          classNames?.day_button,
        ),
        selected: cn(
          "rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          classNames?.selected,
        ),
        today: cn("bg-accent text-accent-foreground", classNames?.today),
        outside: cn("text-muted-foreground opacity-50", classNames?.outside),
        disabled: cn("text-muted-foreground opacity-50", classNames?.disabled),
        hidden: cn("invisible", classNames?.hidden),
      }}
      components={{
        Chevron: ({ className: chClass, orientation, ...chevronProps }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeftIcon
              : orientation === "right"
                ? ChevronRightIcon
                : ChevronDownIcon;
          return <Icon className={cn("size-4", chClass)} {...chevronProps} />;
        },
        ...components,
      }}
      {...props}
    />
  );
}

export { Calendar };
