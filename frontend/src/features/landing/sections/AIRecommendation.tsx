import Container from "../components/Container";
import Heading from "../components/Heading";
import Button from "../components/Button";
import FactorItem from "../components/FactorItem";
import ReasonItem from "../components/ReasonItem";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const ai = {
  eyebrow: "التوصية الذكية",
  title: "قرار تسجيل المساقات، بشرح واضح لا بصندوق أسود",
  text: "يحلل النظام وضعك قبل كل فصل، ثم يقترح المساقات الأنسب ويخبرك لماذا اختارها، لتقرر وأنت مطمئن.",
  factors: [
    { title: "سجلّك الأكاديمي", text: "المساقات المنجزة والمتبقية ومتطلباتها السابقة." },
    { title: "عبء الفصل المناسب", text: "توازن بين المساقات الصعبة والخفيفة حسب قدرتك." },
    { title: "خطة التخرّج", text: "اختيارات تبقيك على المسار الصحيح نحو إنهاء الدرجة." },
  ],
  explainTitle: "لماذا نوصي بمساق «قواعد البيانات»؟",
  reasons: [
    "أنجزت المتطلب السابق للمساق.",
    "يفتح لك الباب لمساقات متقدمة في الفصول التالية.",
    "يتوافق مع وقتك المتاح دون تعارض مع مساقاتك الأخرى.",
  ],
  actions: ["أضفه لخطتي", "اعرض البدائل"],
};

export default function AIRecommendation() {
  return (
    <section id="ai" className="bg-ink py-[88px] text-white">
      <Container className="flex flex-wrap items-center justify-between gap-14">
        <div className="min-w-0 flex-[1_1_420px]">
          <span className="text-[15px] font-semibold text-accent-mint">{ai.eyebrow}</span>
          <Heading className="mb-4 mt-3">{ai.title}</Heading>
          <p className="mb-7 text-[17px] text-[#C9D6EA]">{ai.text}</p>
          <div className="flex flex-col gap-4">
            {ai.factors.map((f, i) => (
              <FactorItem key={f.title} index={i + 1} delay={i * 150} {...f} />
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-[1_1_400px]">
          <div className="rounded-2xl bg-white p-7 text-ink">
            <div className="mb-1.5 text-sm text-muted">مثال توضيحي</div>
            <strong className="text-xl">{ai.explainTitle}</strong>
            <div className="mt-4 flex flex-col gap-3 text-[15px] text-muted">
              {ai.reasons.map((r, i) => (
                <ReasonItem key={r} delay={400 + i * 250}>
                  {r}
                </ReasonItem>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5 border-t border-line pt-4">
              <Button className="!min-h-[44px]">{ai.actions[0]}</Button>
              <Button variant="soft" className="!min-h-[44px]">
                {ai.actions[1]}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
