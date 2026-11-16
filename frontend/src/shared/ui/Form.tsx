import { type InputHTMLAttributes, type SelectHTMLAttributes, useId } from "react";

export function Input({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const auto = useId(),
    id = props.id ?? auto;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input {...props} id={id} aria-describedby={hint ? id + "-hint" : undefined} />
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const auto = useId(),
    id = props.id ?? auto;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select {...props} id={id}>
        {children}
      </select>
    </div>
  );
}
