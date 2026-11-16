import { type ReactNode } from "react";
import { Info, AlertCircle, BookOpen } from "lucide-react";
import { errorMessage } from "../api/client";
import { Button } from "./Button";

export function Skeleton() {
  return (
    <div className="grid w-full gap-3" aria-label="جارٍ تحميل البيانات" role="status">
      <div className="h-20 animate-pulse rounded-card bg-edge" />
      <div className="h-36 animate-pulse rounded-card bg-edge" />
      <div className="h-20 animate-pulse rounded-card bg-edge" />
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
    <div className="grid justify-items-center gap-2 rounded-card border border-dashed border-edge bg-panel px-6 py-10 text-center">
      <div className="mb-2 grid size-14 place-items-center rounded-2xl border border-dashed border-brand/40 bg-brand-soft text-brand">
        <BookOpen size={25} />
      </div>
      <h3 className="text-base font-bold text-fg">{title}</h3>
      <p className="max-w-sm text-sm text-fg-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div
      className="grid justify-items-center gap-2 rounded-card border border-danger-edge bg-danger-soft px-6 py-8 text-center text-danger"
      role="alert"
    >
      <AlertCircle size={26} />
      <h3 className="text-base font-bold">لم نتمكن من تحميل البيانات</h3>
      <p className="max-w-md text-sm opacity-90">{errorMessage(error)}</p>
      {retry && (
        <Button variant="secondary" onClick={retry} className="mt-2">
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-control border border-brand/25 bg-brand-soft px-4 py-3.5 text-[13px] leading-relaxed text-brand-deep">
      <Info size={20} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
