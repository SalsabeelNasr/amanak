"use client";

import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const textareaClass =
  "flex min-h-[5rem] w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base shadow-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

export type TextareaFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  className?: string;
  id?: string;
  disabled?: boolean;
};

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  rows = 4,
  className,
  id,
  disabled,
}: TextareaFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const inputId = id ?? String(name);
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <textarea
        id={inputId}
        rows={rows}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(textareaClass, "aria-invalid:ring-destructive/20")}
        aria-invalid={fieldState.invalid}
        aria-describedby={fieldState.error ? `${inputId}-error` : undefined}
        {...field}
        value={field.value ?? ""}
      />
      {fieldState.error?.message ? (
        <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
          {fieldState.error.message}
        </p>
      ) : null}
    </div>
  );
}
