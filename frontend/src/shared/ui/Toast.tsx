import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

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
          className={`toast toast-${toast.type}`}
          role={toast.type === "error" ? "alert" : "status"}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={21} />
          ) : (
            <AlertCircle size={21} />
          )}
          <span>{toast.message}</span>
          <button
            className="icon-btn"
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
