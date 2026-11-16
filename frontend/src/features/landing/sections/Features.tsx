import Container from "../components/Container";
import Heading from "../components/Heading";
import FeatureCard from "../components/FeatureCard";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const features = [
  {
    icon: "spark",
    title: "توصية المساقات",
    text: "اقتراحات لتسجيل المساقات كل فصل بحسب وضعك الأكاديمي، مع توضيح سبب كل اختيار.",
  },
  {
    icon: "calendar",
    title: "التقويم الدراسي",
    text: "محاضراتك واختباراتك وتسليماتك في مكان واحد، بنظرة واضحة على أسبوعك.",
  },
  {
    icon: "timer",
    title: "مؤقّت التركيز",
    text: "جلسات مذاكرة بفواصل راحة تساعدك على التركيز وإنجاز المزيد في وقت أقل.",
  },
  {
    icon: "tasks",
    title: "قائمة المهام",
    text: "رتّب واجباتك ومشاريعك حسب الأولوية وموعد التسليم، وتابع ما أنجزته.",
  },
  {
    icon: "bell",
    title: "إشعارات ذكية",
    text: "تذكيرات في الوقت المناسب بالمواعيد والمهام، حتى لا يفوتك شيء مهم.",
  },
  {
    icon: "chat",
    title: "مساعد ذكي",
    text: "اسأل عن موادك وخطتك الدراسية واحصل على إجابات فورية، بالاعتماد على Gemini.",
  },
];

const featureBenefits = [
  "توفّر عليك أخطاء التسجيل",
  "تعرف أسبوعك بنظرة واحدة",
  "تنجز أكثر في وقت أقل",
  "لا تضيع واجبًا بعد اليوم",
  "لا يفوتك موعد مهم",
  "تفهم موادك دون انتظار أحد",
];

export default function Features() {
  return (
    <section id="features" className="border-y border-line bg-white py-20">
      <Container>
        <div className="mx-auto mb-12 max-w-[620px] text-center">
          <Heading className="mb-3">مزايا تتحول إلى فوائد في يومك الدراسي</Heading>
          <p className="text-[17px] text-muted">
            كل أداة مصممة لتوفر عليك وقتًا أو تخفف عنك قلقًا.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          {features.map((f, i) => (
            <FeatureCard
              key={f.title}
              delay={i * 90}
              benefit={featureBenefits[i]}
              {...f}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
