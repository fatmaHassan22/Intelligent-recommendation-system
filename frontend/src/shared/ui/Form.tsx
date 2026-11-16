import { type InputHTMLAttributes, type SelectHTMLAttributes, useId } from "react";
import { cn } from "../lib/cn";

const labelClass = "text-[13px] font-semibold text-fg";
const controlClass =
  "min-h-11 w-full rounded-control border border-input-edge bg-input px-3.5 py-2.5 text-sm text-fg transition-colors placeholder:text-fg-muted/60 focus:border-brand focus:outline-2 focus:outline-brand/30 disabled:cursor-not-allowed disabled:bg-panel-2 disabled:text-fg-muted aria-[invalid=true]:border-danger";
const hintClass = "text-xs text-fg-muted";

export function Input({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const auto = useId(),
    id = props.id ?? auto;
  return (
    <div className="mb-5 flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-describedby={hint ? id + "-hint" : undefined}
        className={cn(controlClass, className)}
      />
      {hint && (
        <small id={id + "-hint"} className={hintClass}>
          {hint}
        </small>
      )}
    </div>
  );
}

export function Select({
  label,
  children,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const auto = useId(),
    id = props.id ?? auto;
  return (
    <div className="mb-5 flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select {...props} id={id} className={cn(controlClass, className)}>
        {children}
      </select>
    </div>
  );
}
