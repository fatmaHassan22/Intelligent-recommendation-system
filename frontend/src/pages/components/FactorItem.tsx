import Reveal from "./Reveal";

type Props = { index: number; title: string; text: string; delay?: number };

export default function FactorItem({ index, title, text, delay = 0 }: Props) {
  return (
    <Reveal delay={delay}>
      <div className="flex gap-3.5">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-mint font-bold text-ink">{index}</span>
        <div>
          <strong>{title}</strong>
          <div className="text-[15px] text-[#C9D6EA]">{text}</div>
        </div>
      </div>
    </Reveal>
  );
}
