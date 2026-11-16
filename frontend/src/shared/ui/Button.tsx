import { type ButtonHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

export function Button({
  children,
  variant = "primary",
  busy = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={["btn", `btn-${variant}`, props.className].filter(Boolean).join(" ")}
      aria-busy={busy}
    >
      {busy ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
    </button>
  );
}
