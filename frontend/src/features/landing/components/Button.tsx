import type { ReactNode, HTMLAttributes } from "react";

const variants = {
  primary: "bg-accent !text-white hover:bg-[#096459]",
  secondary: "bg-white text-ink border border-line hover:bg-surface",
  mint: "bg-accent-mint text-ink hover:bg-[#46d9c0]",
  soft: "bg-[#F1F4F9] text-ink hover:bg-line",
  ghost: "border border-white/30 text-white hover:bg-white/10",
};

type Props = {
  href?: string;
  variant?: keyof typeof variants;
  className?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>;

export default function Button({
  href,
  variant = "primary",
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 text-base font-semibold transition duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[.98]";
  const cls = `${base} ${variants[variant]} ${className}`;
  return href ? (
    <a href={href} className={cls} {...rest}>
      {children}
    </a>
  ) : (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}
