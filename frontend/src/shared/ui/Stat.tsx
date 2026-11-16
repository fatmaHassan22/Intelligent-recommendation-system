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
    <article className="stat">
      <div className="stat-icon">{icon}</div>
      <p>{label}</p>
      <strong>{value ?? "غير معروف"}</strong>
      <small>{hint}</small>
    </article>
  );
}
