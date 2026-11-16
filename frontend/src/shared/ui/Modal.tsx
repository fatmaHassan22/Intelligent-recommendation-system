import { useEffect, useRef, type ReactNode, useId } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

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
