import { type ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <span className="mb-1 block text-xs font-semibold text-brand">{eyebrow}</span>
        )}
        <h1 className="text-[1.7rem] leading-tight font-bold text-fg">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
