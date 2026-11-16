import { useCallback, useEffect, useState, type RefObject } from "react";

const FOCUSABLE = "a,button:not(:disabled)";

/** يحبس التنقل بزر Tab داخل الحاوية (للوحة الجانبية المفتوحة على الموبايل). */
function trapTab(e: KeyboardEvent, container: HTMLElement | null) {
  const items = Array.from(
    container?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
  ).filter((el) => el.offsetParent !== null);
  const first = items[0];
  const last = items[items.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last?.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first?.focus();
  }
}

/**
 * قائمة جانبية منزلقة (drawer) للموبايل:
 * - تمنع تمرير الصفحة خلفها أثناء الفتح.
 * - تنقل التركيز إليها وتحبسه داخلها، وترجعه لمكانه عند الإغلاق.
 * - تُغلق بزر Escape.
 */
export function useMobileDrawer(panelRef: RefObject<HTMLElement | null>) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
      else if (e.key === "Tab") trapTab(e, panelRef.current);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, panelRef]);

  return { isOpen, open, close };
}
