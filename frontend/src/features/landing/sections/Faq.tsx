import Container from "../components/Container";
import Heading from "../components/Heading";
import Reveal from "../components/Reveal";
import FaqItem from "../components/FaqItem";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const faq = {
  title: "الأسئلة الشائعة",
  text: "إجابات سريعة قبل أن تبدأ.",
  items: [
    {
      q: "هل يقرر الذكاء الاصطناعي بدلًا مني؟",
      a: "لا. مسار يقترح ويشرح سبب كل اقتراح، والقرار النهائي لك دائمًا، ويمكنك تعديل الخطة أو طلب بدائل.",
    },
    {
      q: "على ماذا تعتمد توصيات المساقات؟",
      a: "على سجلك الأكاديمي، والمتطلبات السابقة، وعبء الفصل المناسب، وخطة تخرجك.",
    },
    {
      q: "ما دور المساعد الذكي؟",
      a: "يجيب عن أسئلتك حول موادك وخطتك ويساعدك على ترتيب وقتك، وهو مربوط بـ Gemini.",
    },
    { q: "هل تدعم المنصة جامعتي؟", a: "[أضف هنا قائمة الجامعات والتخصصات المدعومة]." },
    {
      q: "كيف تُحمى بياناتي؟",
      a: "[أضف هنا سياسة الخصوصية وكيفية استخدام بيانات الطالب].",
    },
    { q: "هل المنصة مجانية؟", a: "[أضف هنا تفاصيل الأسعار والخطط]." },
  ],
};

export default function Faq() {
  return (
    <section id="faq" className="border-t border-line bg-white py-20">
      <Container className="max-w-[820px]">
        <Reveal className="mb-10 text-center">
          <Heading className="mb-3">{faq.title}</Heading>
          <p className="text-[17px] text-muted">{faq.text}</p>
        </Reveal>
        <div className="flex flex-col gap-3">
          {faq.items.map((it, i) => (
            <FaqItem key={it.q} delay={i * 70} {...it} />
          ))}
        </div>
      </Container>
    </section>
  );
}
