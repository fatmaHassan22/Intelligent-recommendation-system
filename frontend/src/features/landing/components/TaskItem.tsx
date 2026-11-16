import Icon from "./Icon";

type Props = { label: string; done: boolean; onToggle: () => void };

export default function TaskItem({ label, done, onToggle }: Props) {
  return (
    <button
      type="button"
      aria-pressed={done}
      onClick={onToggle}
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-xl border px-4 text-start transition-all duration-300 active:scale-[.98] ${
        done
          ? "border-accent bg-accent-soft"
          : "border-line bg-white hover:-translate-y-0.5 hover:border-accent"
      }`}
    >
      <span
        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full border-2 transition-all duration-300 ${
          done ? "scale-110 border-accent bg-accent text-white" : "border-[#B8C4D8]"
        }`}
      >
        {done && <Icon name="check" size={16} className="animate-pop" />}
      </span>
      <span className={`transition-colors ${done ? "text-muted line-through" : ""}`}>
        {label}
      </span>
    </button>
  );
}
