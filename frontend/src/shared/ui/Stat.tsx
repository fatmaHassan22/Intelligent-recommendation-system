import { type ReactNode } from "react";

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-0.5 rounded-card border border-edge bg-panel p-4 shadow-card">
      <div className="mb-2 grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
        {icon}
      </div>
      <p className="text-xs text-fg-muted">{label}</p>
      <strong className="text-2xl leading-tight font-bold text-fg">
        {value ?? "غير معروف"}
      </strong>
      <small className="text-xs text-fg-muted">{hint}</small>
    </article>
  );
}
