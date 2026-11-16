import Reveal from "./Reveal";

type Props = { quote: string; name: string; meta: string; delay?: number };

export default function QuoteCard({ quote, name, meta, delay = 0 }: Props) {
  return (
    <Reveal delay={delay} className="h-full">
      <figure className="m-0 flex h-full flex-col justify-between rounded-2xl border border-line bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-accent">
        <blockquote className="m-0 mb-5 text-muted">{quote}</blockquote>
        <figcaption className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft font-bold text-accent">
            ط
          </span>
          <div>
            <strong>{name}</strong>
            <div className="text-sm text-muted">{meta}</div>
          </div>
        </figcaption>
      </figure>
    </Reveal>
  );
}
