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

export type TextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "tel";
  className?: string;
  id?: string;
  autoComplete?: string;
  disabled?: boolean;
};

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  required,
  type = "text",
  className,
  id,
  autoComplete,
  disabled,
}: TextFieldProps<T>) {
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
        placeholder={placeholder}
        autoComplete={autoComplete}
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
