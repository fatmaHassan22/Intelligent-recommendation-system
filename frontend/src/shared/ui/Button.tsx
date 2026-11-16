import { type ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control border border-transparent px-4 py-2 text-[13px] font-semibold leading-none transition-[background-color,color,border-color,box-shadow,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0 [&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-brand hover:bg-brand-deep",
  secondary:
    "border-edge bg-panel text-fg hover:border-brand hover:bg-brand-soft hover:text-brand-deep",
  ghost: "text-brand hover:bg-brand-soft",
  danger: "border-danger-edge bg-danger-soft text-danger hover:border-danger",
};

/** نفس شكل الزر لعناصر أخرى (مثل <Link>): <Link className={buttonClass("primary")}> */
export const buttonClass = (variant: ButtonVariant = "primary", className?: string) =>
  cn(base, variants[variant], className);

/** زر أيقونة مربع (إغلاق، قائمة...). يحتاج aria-label دائماً. */
export const iconButtonClass = (className?: string) =>
  cn(
    "inline-grid size-9 shrink-0 place-items-center rounded-control text-fg-muted transition-colors hover:bg-brand-soft hover:text-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-55",
    className,
  );

export function Button({
  children,
  variant = "primary",
  busy = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={buttonClass(variant, className)}
      aria-busy={busy}
    >
      {busy ? <LoaderCircle size={17} className="animate-spin" /> : null}
      {children}
    </button>
  );
}
