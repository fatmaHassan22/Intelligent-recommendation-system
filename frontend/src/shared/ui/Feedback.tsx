import { type ReactNode } from "react";
import { Info, AlertCircle, BookOpen } from "lucide-react";
import { errorMessage } from "../api/client";
import { Button } from "./Button";

export function Skeleton() {
  return (
    <div className="skeleton-wrap" aria-label="جارٍ تحميل البيانات" role="status">
      <div className="skeleton h-20" />
      <div className="skeleton h-36" />
      <div className="skeleton h-20" />
    </div>
  );
}

export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <BookOpen size={25} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={24} />
      <h3>لم نتمكن من تحميل البيانات</h3>
      <p>{errorMessage(error)}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice">
      <Info size={20} />
      <div>{children}</div>
    </div>
  );
}
