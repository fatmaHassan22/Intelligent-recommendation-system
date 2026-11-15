import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  useId,
} from "react";
import {
  CheckCircle2,
  Info,
  AlertCircle,
  X,
  BookOpen,
  LoaderCircle,
  ArrowLeft,
} from "lucide-react";
import { errorMessage } from "../api/client";

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
      className={`btn btn-${variant} ${props.className ?? ""}`}
      aria-busy={busy}
    >
      {busy ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Input({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const auto = useId(),
    id = props.id ?? auto;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-describedby={hint ? id + "-hint" : undefined}
      />
      {hint && <small id={id + "-hint"}>{hint}</small>}
    </div>
  );
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const auto = useId(),
    id = props.id ?? auto;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select {...props} id={id}>
        {children}
      </select>
    </div>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "teal" | "amber" | "blue";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Skeleton() {
  return (
    <div
      className="skeleton-wrap"
      aria-label="جارٍ تحميل البيانات"
      role="status"
    >
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
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
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
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current!,
      previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header>
        <h2 id={id}>{title}</h2>
        <button className="icon-btn" aria-label="إغلاق" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  description,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="confirm-copy">{description}</p>
      <div className="dialog-actions">
        <Button variant="secondary" disabled={busy} onClick={onClose} autoFocus>
          إلغاء
        </Button>
        <Button busy={busy} onClick={onConfirm}>
          تأكيد
        </Button>
      </div>
    </Modal>
  );
}
type ToastFn = (message: string, type?: "success" | "error") => void;
const ToastContext = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: string } | null>(
    null,
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <ToastContext.Provider
      value={(message, type = "success") => setToast({ message, type })}
    >
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

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <article className="stat">
      <div className="stat-icon">{icon}</div>
      <p>{label}</p>
      <strong>{value ?? "غير معروف"}</strong>
      <small>{hint}</small>
    </article>
  );
}
export const number = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "غير معروف"
    : new Intl.NumberFormat("ar").format(value);

export const roleLabel = (value: string) =>
  ({ REQUIRED: "إجباري", ELECTIVE: "اختياري", UNVERIFIED: "غير متحقق" })[
    value
  ] ?? "غير معروف";

export const modeLabel = (value: string) =>
  ({ LIGHT: "خفيف", BALANCED: "متوازن", FAST_GRADUATION: "تخرج أسرع" })[
    value
  ] ?? value;
