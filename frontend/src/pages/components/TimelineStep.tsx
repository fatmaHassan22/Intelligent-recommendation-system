import Heading from "./Heading";
import Reveal from "./Reveal";

// index يبدأ من 0. الخطوات الزوجية على يمين الخط والفردية على يساره (RTL).
type Props = { index: number; title: string; text: string; active: boolean; markRef: (el: HTMLSpanElement | null) => void };

export default function TimelineStep({ index, title, text, active, markRef }: Props) {
  const side = index % 2 ? "md:col-start-2 md:pr-12" : "md:col-start-1 md:pl-12";
  return (
    <div className="relative pr-14 md:grid md:grid-cols-2 md:pr-0">
      <span ref={markRef}
        className={`absolute right-0 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-all duration-500 md:left-1/2 md:right-auto md:-translate-x-1/2 ${
          active ? "scale-110 border-accent bg-accent text-white" : "border-line bg-white text-muted"}`}>
        {index + 1}
      </span>
      <Reveal className={side}>
        <div className={`rounded-2xl border bg-white p-7 transition duration-500 hover:-translate-y-1 ${active ? "border-accent" : "border-line"}`}>
          <div className="mb-1 text-sm font-semibold text-accent">الخطوة {index + 1}</div>
          <Heading as="h3" size="md" className="mb-2">{title}</Heading>
          <p className="text-muted">{text}</p>
        </div>
      </Reveal>
    </div>
  );
}
