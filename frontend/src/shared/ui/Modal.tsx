import { useEffect, useRef, type ReactNode, useId } from "react";
import { X } from "lucide-react";
import { Button, iconButtonClass } from "./Button";
import { cn } from "../lib/cn";

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
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-[510px] rounded-card border border-edge bg-panel p-6 text-fg shadow-pop backdrop:bg-overlay backdrop:backdrop-blur-[3px]",
        className,
      )}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 id={id} className="text-lg font-bold text-fg">
          {title}
        </h2>
        <button className={iconButtonClass()} aria-label="إغلاق" onClick={onClose}>
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
      <p className="text-[13px] leading-relaxed text-fg-muted">{description}</p>
      <div className="mt-5 flex justify-end gap-2.5">
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
