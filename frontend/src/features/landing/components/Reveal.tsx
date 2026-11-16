import type { ReactNode } from "react";
import useInView from "../hooks/useInView";

// يُظهر المحتوى بانزلاق خفيف عند وصول المستخدم إليه.
type Props = { delay?: number; className?: string; children: ReactNode };

export default function Reveal({ delay = 0, className = "", children }: Props) {
  const [ref, seen] = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${seen ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}
