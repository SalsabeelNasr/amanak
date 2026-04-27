"use client";

import {
  useController,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  type?: "date" | "datetime-local" | "time";
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  type = "datetime-local",
  required,
  disabled,
  className,
  id,
}: DateFieldProps<T>) {
  const { field, fieldState } = useController({ control, name });
  const inputId = id ?? String(name);
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={inputId}
        type={type}
        disabled={disabled}
        aria-invalid={fieldState.invalid}
        aria-describedby={fieldState.error ? `${inputId}-error` : undefined}
        className="min-h-10"
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
