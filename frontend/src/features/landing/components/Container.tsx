import type { ReactNode } from "react";
type Props = { className?: string; children: ReactNode };

export default function Container({ className = "", children }: Props) {
  return (
    <div className={`mx-auto w-full max-w-[1160px] px-6 ${className}`}>{children}</div>
  );
}
