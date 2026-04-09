"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

const dialogContentVariants = cva(
  [
    "relative flex w-full max-w-[calc(100vw-2rem)] flex-col",
    "bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out",
    "data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95",
    "rounded-2xl border border-border",
  ],
  {
    variants: {
      size: {
        xs: "sm:max-w-[var(--dialog-max-w-xs)]",
        sm: "sm:max-w-[var(--dialog-max-w-sm)]",
        md: "sm:max-w-[var(--dialog-max-w-md)]",
        lg: "sm:max-w-[var(--dialog-max-w-lg)]",
        xl: "sm:max-w-[var(--dialog-max-w-xl)]",
        full: "w-[min(95vw,calc(100vw-2rem))] sm:max-w-6xl",
      },
      layout: {
        default: "max-h-[calc(100vh-2rem)] gap-4 overflow-y-auto p-6",
        scrollable:
          "max-h-[var(--dialog-max-height)] gap-0 overflow-hidden p-6",
        scrollableTall:
          "max-h-[var(--dialog-max-height-tall)] gap-0 overflow-hidden p-6",
        wizard:
          "max-h-[90vh] gap-0 overflow-hidden border-none p-0 shadow-2xl sm:rounded-[2rem] bg-background",
      },
    },
    defaultVariants: {
      size: "lg",
      layout: "default",
    },
  },
)

export type DialogContentSize = NonNullable<
  VariantProps<typeof dialogContentVariants>["size"]
>
export type DialogContentLayout = NonNullable<
  VariantProps<typeof dialogContentVariants>["layout"]
>

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  size,
  layout,
  ...props
}: DialogPrimitive.Popup.Props &
  VariantProps<typeof dialogContentVariants> & {
    showCloseButton?: boolean
  }) {
  const resolvedLayout = layout ?? "default"
  const isWizard = resolvedLayout === "wizard"
  const closeOffset = isWizard ? "top-6 end-6" : "top-4 end-4"

  return (
    <DialogPortal>
      <DialogOverlay />
      {/* Full-viewport flex centering so dialogs stay centered even when content scrolls; overlay still receives outside clicks via pointer-events-none. */}
      <div
        data-slot="dialog-positioner"
        className="fixed inset-0 z-50 overflow-y-auto pointer-events-none"
      >
        <div className="flex min-h-dvh w-full items-center justify-center p-4">
          <DialogPrimitive.Popup
            data-slot="dialog-content"
            className={cn(
              dialogContentVariants({ size, layout: resolvedLayout }),
              "pointer-events-auto relative",
              className,
            )}
            {...props}
          >
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                render={
                  <Button
                    variant="ghost"
                    className={cn("absolute size-8 p-0", closeOffset)}
                    size="icon"
                  />
                }
              >
                <XIcon className="size-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </DialogPrimitive.Popup>
        </div>
      </div>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex shrink-0 flex-col gap-1.5 text-center sm:text-start",
        className
      )}
      {...props}
    />
  )
}

/** Scrollable main region for `layout="scrollable"` / `scrollableTall` dialogs. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-lg font-semibold leading-none tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
