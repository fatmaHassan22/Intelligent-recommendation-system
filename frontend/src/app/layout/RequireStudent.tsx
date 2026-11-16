import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { User } from "../../shared/api/types";
import { useAuth } from "../../features/auth/AuthProvider";
import { layoutText } from "../../config/strings.ar";
import { Button, ErrorState, Skeleton } from "../../shared/ui";

/**
 * حارس المسارات: يعرض المحتوى فقط لمستخدم مسجّل دخوله بدور طالب.
 * باقي الحالات (تحميل، خطأ، غير مسجّل، حساب إداري) تُعالَج هنا.
 */
export function RequireStudent({ children }: { children: (user: User) => ReactNode }) {
  const auth = useAuth();

  if (auth.loading)
    return (
      <div className="full-state">
        <Skeleton />
      </div>
    );

  if (auth.error)
    return (
      <div className="full-state">
        <ErrorState error={auth.error} retry={auth.refetch} />
      </div>
    );

  if (!auth.user) return <Navigate to="/login" replace />;

  if (auth.user.role !== "STUDENT")
    return (
      <div className="full-state">
        <h1>{layoutText.adminTitle}</h1>
        <p>{layoutText.adminNotice}</p>
        <Button onClick={() => void auth.logout()}>{layoutText.logout}</Button>
      </div>
    );

  return <>{children(auth.user)}</>;
}
