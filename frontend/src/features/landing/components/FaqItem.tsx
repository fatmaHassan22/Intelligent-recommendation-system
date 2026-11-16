import Reveal from "./Reveal";

type Props = { q: string; a: string; delay?: number };

export default function FaqItem({ q, a, delay = 0 }: Props) {
  return (
    <Reveal delay={delay}>
      <details className="group rounded-2xl border border-line bg-white px-5 open:border-accent open:bg-accent-soft/40">
        <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
          {q}
          <span
            aria-hidden="true"
            className="text-2xl leading-none text-accent transition-transform duration-300 group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <p className="pb-5 text-muted">{a}</p>
      </details>
    </Reveal>
  );
}
