import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../lib/cn";

/**
 * شعار "مسار".
 * - light: النسخة الفاتحة فوق الخلفيات الداكنة (الشريط الجانبي).
 * - textClassName: للتحكم بنص الشعار (مثلاً إخفاؤه في الشريط المضغوط).
 */
export function Logo({
  light = false,
  className,
  textClassName,
}: {
  light?: boolean;
  className?: string;
  textClassName?: string;
}) {
  return (
    <Link
      to="/"
      className={cn(
        "flex items-center gap-[11px] rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
        light ? "text-white" : "text-[#193247]",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-[43px] shrink-0 place-items-center rounded-xl text-white",
          light ? "bg-gradient-to-br from-brand to-brand-deep shadow-brand" : "bg-brand",
        )}
      >
        <GraduationCap size={25} />
      </span>
      <span className={textClassName}>
        <strong className="block text-[25px] leading-[1.3] font-extrabold">مسار</strong>
        <small
          className={cn(
            "mt-0.5 block text-xs",
            light ? "text-[#c1d0d8]" : "text-[#66747f]",
          )}
        >
          الدعم الأكاديمي الذكي
        </small>
      </span>
    </Link>
  );
}
