"use client";

import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const selectClass = cn(
  "flex h-10 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "dark:bg-input/30",
);

export type SelectOption = { value: string; label: string };

export type SelectFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  options: SelectOption[];
  placeholderOption?: { value: string; label: string };
  required?: boolean;
  className?: string;
  id?: string;
};

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholderOption,
  required,
  className,
  id,
}: SelectFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const inputId = id ?? String(name);
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <select
        id={inputId}
        className={selectClass}
        aria-invalid={fieldState.invalid}
        aria-describedby={fieldState.error ? `${inputId}-error` : undefined}
        {...field}
        value={field.value ?? (placeholderOption ? "" : field.value)}
      >
        {placeholderOption ? (
          <option value={placeholderOption.value}>{placeholderOption.label}</option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {fieldState.error?.message ? (
        <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
          {fieldState.error.message}
        </p>
      ) : null}
    </div>
  );
}
