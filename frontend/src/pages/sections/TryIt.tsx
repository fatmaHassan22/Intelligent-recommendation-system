import { useState, type CSSProperties } from "react";
import Container from "../components/Container";
import Heading from "../components/Heading";
import Reveal from "../components/Reveal";
import ProgressRing from "../components/ProgressRing";
import TaskItem from "../components/TaskItem";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const tryIt = {
  title: "جرّبها الآن: أنجز مهامك وشاهد تقدّمك",
  text: "اضغط على المهام لتنجزها، وشاهد كيف يشجعك مسار على الاستمرار.",
  tasks: ["مراجعة ملخص الفصل الثالث", "تسليم تقرير المختبر", "جلسة تركيز لمدة 25 دقيقة", "ترتيب جدول الأسبوع"],
  messages: [
    "ابدأ بأول مهمة، فالخطوة الصغيرة تكفي.",
    "بداية ممتازة، واصل!",
    "أنت في المنتصف، استمر على هذا الإيقاع.",
    "مهمة واحدة فقط وتنهي يومك.",
    "أحسنت! أنجزت كل مهام اليوم.",
  ],
};

const COLORS = ["#5EEAD4", "#0B7A6E", "#0B1F3A"];

export default function TryIt() {
  const [done, setDone] = useState<number[]>([]);
  const total = tryIt.tasks.length;
  const pct = Math.round((done.length / total) * 100);
  const complete = done.length === total;
  const toggle = (i: number) => setDone((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));

  return (
    <section id="try" className="pb-20 pt-20">
      <Container>
        <div className="mx-auto mb-10 max-w-[620px] text-center">
          <Heading className="mb-3">{tryIt.title}</Heading>
          <p className="text-[17px] text-muted">{tryIt.text}</p>
        </div>
        <Reveal>
          <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-center gap-10 rounded-3xl border border-line bg-white p-8 shadow-[0_20px_50px_rgba(11,31,58,0.08)]">
            <div className="flex w-[220px] flex-col items-center gap-4 text-center">
              <div className="relative">
                <ProgressRing value={pct} />
                {complete && (
                  <div aria-hidden="true" key={done.join()} className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    {Array.from({ length: 16 }).map((_, i) => {
                      const a = (i / 16) * 2 * Math.PI;
                      const r = 90 + (i % 3) * 28;
                      return <span key={i} className="absolute h-2.5 w-2.5 animate-burst rounded-full"
                        style={{ background: COLORS[i % 3], "--x": `${Math.cos(a) * r}px`, "--y": `${Math.sin(a) * r}px` } as CSSProperties} />;
                    })}
                  </div>
                )}
              </div>
              <p aria-live="polite" className={`min-h-[56px] font-semibold ${complete ? "animate-pop text-accent" : "text-muted"}`}>
                {tryIt.messages[done.length]}
              </p>
            </div>
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
              {tryIt.tasks.map((t, i) => (
                <TaskItem key={t} label={t} done={done.includes(i)} onToggle={() => toggle(i)} />
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
