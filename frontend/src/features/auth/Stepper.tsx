import { CSSProperties } from "react";
import { Check } from "lucide-react";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const n = steps.length,
    p = n > 1 ? current / (n - 1) : 0;
  return (
    <ol
      aria-label="خطوات إنشاء الحساب"
      style={{ "--n": n, "--p": p } as CSSProperties}
      className="relative mb-8 grid animate-rise auto-cols-fr grid-flow-col [animation-delay:.2s]"
    >
      <span
        aria-hidden="true"
        className="absolute top-[15px] h-[3px] rounded bg-[#e8eef4] [inset-inline-start:calc(100%/var(--n)/2)] [width:calc(100%_-_100%/var(--n))]"
      />
      <span
        aria-hidden="true"
        className="absolute top-[15px] h-[3px] rounded bg-accent transition-[width] duration-700 ease-out [inset-inline-start:calc(100%/var(--n)/2)] [width:calc((100%_-_100%/var(--n))*var(--p))]"
      />
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li
            key={label}
            aria-current={i === current ? "step" : undefined}
            className="relative z-10 flex flex-col items-center gap-2 text-center"
          >
            <span
              className={`grid size-8 place-items-center rounded-full text-[13px] font-bold shadow-[0_0_0_4px_#fff] transition-all duration-500 ${
                state === "todo" ? "bg-[#eef3f7] text-[#8a99ab]" : "bg-accent text-white"
              } ${state === "active" ? "scale-110 animate-ring-pulse" : ""}`}
            >
              {state === "done" ? <Check size={16} className="animate-pop" /> : i + 1}
            </span>
            <small
              className={`hidden max-w-[90px] text-xs transition-colors sm:block ${
                state === "active"
                  ? "font-semibold text-ink"
                  : state === "done"
                    ? "text-accent"
                    : "text-[#8a99ab]"
              }`}
            >
              {label}
            </small>
          </li>
        );
      })}
    </ol>
  );
}
