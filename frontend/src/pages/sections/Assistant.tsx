import { useEffect, useState } from "react";
import Container from "../components/Container";
import Heading from "../components/Heading";
import Reveal from "../components/Reveal";
import ChatBubble from "../components/ChatBubble";
import useInView from "../hooks/useInView";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const assistant = {
  eyebrow: "المساعد الذكي",
  title: "مساعد يعرف خطتك ويجيب عن أسئلتك",
  text: "مربوط بـ Gemini ليشرح لك المفاهيم، ويلخّص موادك، ويساعدك على ترتيب وقتك، في أي لحظة تحتاج فيها إلى يد العون.",
  chat: [
    { from: "user", text: "كيف أوزّع وقتي قبل اختبار الأسبوع القادم؟" },
    { from: "assistant", text: "اقترح تقسيم المراجعة على أيام الأسبوع، وأضيف الجلسات لتقويمك مع تذكير قبل كل جلسة. هل أبدأ؟" },
  ],
  placeholder: "اكتب سؤالك هنا...",
};

// 0: فارغ · 1: سؤال الطالب · 2: المساعد "يكتب" · 3: الإجابة
export default function Assistant() {
  const [ref, seen] = useInView(0.4);
  const [step, setStep] = useState(0);
  const [q, a] = assistant.chat;

  useEffect(() => {
    if (!seen) return;
    const t = [setTimeout(() => setStep(1), 300), setTimeout(() => setStep(2), 1400), setTimeout(() => setStep(3), 3200)];
    return () => t.forEach(clearTimeout);
  }, [seen]);

  return (
    <section id="assistant" className="py-[88px]">
      <Container className="flex flex-wrap items-center justify-between gap-14">
        <Reveal className="order-2 min-w-0 flex-[1_1_400px]">
          <span className="text-[15px] font-semibold text-accent">{assistant.eyebrow}</span>
          <Heading className="mb-4 mt-3">{assistant.title}</Heading>
          <p className="text-[17px] text-muted">{assistant.text}</p>
        </Reveal>
        <div ref={ref} className="order-1 min-w-0 flex-[1_1_400px]">
          <div className="flex min-h-[320px] flex-col gap-3.5 rounded-2xl border border-line bg-white p-7 shadow-[0_20px_50px_rgba(11,31,58,0.08)]">
            {step >= 1 && <ChatBubble from={q.from}>{q.text}</ChatBubble>}
            {step === 2 && (
              <div className="flex animate-pop gap-1.5 self-end rounded-2xl bg-accent px-4 py-4" aria-label="المساعد يكتب">
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ animationDelay: `${i * 160}ms` }} className="h-2 w-2 animate-dot rounded-full bg-white" />
                ))}
              </div>
            )}
            {step >= 3 && <ChatBubble from={a.from}>{a.text}</ChatBubble>}
            <div className="mt-auto rounded-xl border border-line px-4 py-3 text-[15px] text-muted">{assistant.placeholder}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}
