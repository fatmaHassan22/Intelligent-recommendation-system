import { useEffect, useRef, useState } from "react";
import Container from "../components/Container";
import Heading from "../components/Heading";
import Reveal from "../components/Reveal";
import TimelineStep from "../components/TimelineStep";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const steps = [
  { title: "أنشئ حسابك", text: "أدخل تخصصك والمساقات التي أنهيتها لنفهم وضعك." },
  { title: "احصل على توصياتك", text: "يقترح الذكاء الاصطناعي مساقات الفصل مع سبب كل اختيار." },
  { title: "نظّم أسبوعك", text: "استخدم التقويم والمهام والمؤقت، وتابع تقدمك بإشعارات ذكية." },
];

// خط زمني عمودي: يمتلئ مع التمرير نزولًا ويتراجع صعودًا.
export default function HowItWorks() {
  const wrap = useRef<HTMLDivElement>(null);
  const marks = useRef<(HTMLSpanElement | null)[]>([]);
  const [fill, setFill] = useState(0);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let tick = false;
    const update = () => {
      tick = false;
      if (!wrap.current) return;
      const r = wrap.current.getBoundingClientRect();
      const line = window.innerHeight * 0.55;
      setFill(Math.min(r.height - 20, Math.max(0, line - (r.top + 20))));
      let n = -1;
      marks.current.forEach((m, i) => {
        if (!m) return;
        const b = m.getBoundingClientRect();
        if (b.top + b.height / 2 < line) n = i;
      });
      setActive(n);
    };
    const onScroll = () => { if (!tick) { tick = true; requestAnimationFrame(update); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);

  return (
    <section id="how" className="py-20">
      <Container>
        <Reveal className="mx-auto mb-11 max-w-[620px] text-center">
          <Heading className="mb-3">كيف يعمل مسار؟</Heading>
          <p className="text-[17px] text-muted">ثلاث خطوات من أول تسجيل حتى فصل منظّم.</p>
        </Reveal>
        <div ref={wrap} className="relative mx-auto max-w-[900px]">
          <div aria-hidden="true" className="absolute bottom-0 right-[19px] top-5 w-[3px] rounded-full bg-line md:left-1/2 md:right-auto md:-translate-x-1/2">
            <div className="w-full rounded-full bg-accent" style={{ height: fill }} />
          </div>
          <div className="relative flex flex-col gap-10 md:gap-16">
            {steps.map((s, i) => (
              <TimelineStep key={s.title} index={i} active={i <= active} markRef={(el) => (marks.current[i] = el)} {...s} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
