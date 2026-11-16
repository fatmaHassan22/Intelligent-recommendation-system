import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link className={`logo ${light ? "logo-light" : ""}`} to="/">
      <span className="logo-mark">
        <GraduationCap size={25} />
      </span>
      <span>
        <strong>مسار</strong>
        <small>الدعم الأكاديمي الذكي</small>
      </span>
    </Link>
  );
}
