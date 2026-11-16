import { type ReactNode } from "react";
import { cn } from "../lib/cn";

const tones = {
  neutral: "bg-panel-2 text-fg-muted",
  teal: "bg-brand-soft text-brand-deep",
  amber: "bg-warn-soft text-warn",
  blue: "bg-info-soft text-info",
} as const;

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-5",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
