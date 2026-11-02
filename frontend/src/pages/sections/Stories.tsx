import Container from "../components/Container";
import Heading from "../components/Heading";
import Badge from "../components/Badge";
import Reveal from "../components/Reveal";
import QuoteCard from "../components/QuoteCard";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const stories = {
  title: "قصص نجاح وآراء الطلاب",
  note: "النصوص التالية أمثلة توضيحية، استبدلها بآراء طلاب حقيقيين قبل الإطلاق.",
  featured: {
    badge: "قصة نجاح",
    title: "من فصل مزدحم بالتعارضات إلى جدول منظّم",
    quote: "«كنت أسجّل مساقاتي بالتخمين، وأكتشف المتطلبات متأخرًا. مع مسار عرفت لماذا أخذت كل مساق، وصار جدولي واضحًا.»",
    before: "تعارضات في الجدول ومتطلبات مفاجئة.",
    after: "خطة فصل مفهومة بأسباب واضحة.",
  },
  author: { name: "[اسم الطالب]", meta: "[التخصص · الجامعة]" },
  quotes: [
    "«صرت أعرف ماذا آخذ كل فصل ولماذا، دون أن أسأل خمسة أشخاص.»",
    "«مؤقّت التركيز وقائمة المهام غيّرا طريقة مذاكرتي قبل الاختبارات.»",
    "«المساعد يشرح لي النقاط الصعبة في أي وقت، وهذا وفّر عليّ الكثير.»",
  ],
};

export default function Stories() {
  const { featured: f, author } = stories;
  return (
    <section id="stories" className="py-20">
      <Container>
        <Reveal className="mx-auto mb-10 max-w-[640px] text-center">
          <Heading className="mb-3">{stories.title}</Heading>
          <p className="text-[15px] text-muted">{stories.note}</p>
        </Reveal>
        <Reveal className="mb-5">
          <div className="grid gap-6 rounded-3xl border border-line bg-white p-8 shadow-[0_20px_50px_rgba(11,31,58,0.08)] md:grid-cols-[1.3fr_1fr]">
            <div>
              <Badge>{f.badge}</Badge>
              <h3 className="mb-3 mt-4 text-2xl font-bold leading-snug">{f.title}</h3>
              <p className="mb-5 text-muted">{f.quote}</p>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-bold text-accent-mint">ط</span>
                <div><strong>{author.name}</strong><div className="text-sm text-muted">{author.meta}</div></div>
              </div>
            </div>
            <div className="flex flex-col gap-3 self-center">
              <div className="rounded-xl bg-surface p-4"><div className="text-sm font-semibold text-[#9A3412]">قبل</div><p className="text-muted">{f.before}</p></div>
              <div className="rounded-xl bg-accent-soft p-4"><div className="text-sm font-semibold text-accent">بعد</div><p className="text-muted">{f.after}</p></div>
            </div>
          </div>
        </Reveal>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {stories.quotes.map((q, i) => <QuoteCard key={q} quote={q} delay={i * 120} {...author} />)}
        </div>
      </Container>
    </section>
  );
}
