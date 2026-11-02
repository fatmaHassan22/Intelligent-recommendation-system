import type { ReactNode } from "react";
// إطار متصفح يحيط بلقطة الشاشة (استبدل المحتوى بصور حقيقية لاحقًا).
type Props = { children: ReactNode };

export default function ScreenFrame({ children }: Props) {
  return (
    <div className="px-3 pt-3 sm:px-8 sm:pt-8">
      <div className="overflow-hidden rounded-t-2xl border border-b-0 border-line bg-white shadow-[0_10px_30px_rgba(11,31,58,0.10)]">
        <div className="flex items-center gap-1.5 border-b border-line bg-[#F1F4F9] px-4 py-3">
          {[0, 1, 2].map((i) => <i key={i} className="h-2.5 w-2.5 rounded-full bg-[#C9D3E3]" />)}
          <span className="ms-3 rounded-md bg-white px-3 py-0.5 text-xs text-muted">مسار</span>
        </div>
        <div className="min-h-[300px] p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
