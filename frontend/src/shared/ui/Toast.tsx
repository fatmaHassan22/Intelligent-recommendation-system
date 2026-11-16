import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "../lib/cn";
import { iconButtonClass } from "./Button";

type ToastFn = (message: string, type?: "success" | "error") => void;

const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  // مرجع ثابت: كل من يستدعي useToast لا يُعاد رسمه عند ظهور/اختفاء الرسالة.
  const show = useCallback<ToastFn>(
    (message, type = "success") => setToast({ message, type }),
    [],
  );
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          className={cn(
            "fixed inset-x-4 bottom-5 z-50 flex animate-rise items-center gap-3 rounded-control border px-4 py-3 text-sm font-medium shadow-pop sm:inset-x-auto sm:start-6 sm:max-w-md",
            toast.type === "success"
              ? "border-brand/30 bg-panel text-fg"
              : "border-danger-edge bg-danger-soft text-danger",
          )}
          role={toast.type === "error" ? "alert" : "status"}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={21} className="shrink-0 text-brand" />
          ) : (
            <AlertCircle size={21} className="shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            className={iconButtonClass("size-8")}
            aria-label="إغلاق الرسالة"
            onClick={() => setToast(null)}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
