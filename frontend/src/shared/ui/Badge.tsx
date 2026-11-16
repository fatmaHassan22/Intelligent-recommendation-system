import { type ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "amber" | "blue";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
