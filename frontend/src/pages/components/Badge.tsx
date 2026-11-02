import type { ReactNode } from "react";
const tones = {
  accent: "bg-accent-soft text-accent",
  neutral: "bg-[#F1F4F9] text-muted",
};

type Props = { tone?: keyof typeof tones; children: ReactNode };

export default function Badge({ tone = "accent", children }: Props) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
