import Container from "../components/Container";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Heading from "../components/Heading";
import Icon from "../components/Icon";
import CourseItem from "../components/CourseItem";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const hero = {
  badge: "  وضوح أكثر , خطوات أذكى",
  title: "نظّم حياتك الدراسية، واختر مساقاتك بثقة",
  text: "مساحة واحدة لفهم مساقاتك، متابعة ما أنجزته، وتنظيم اختياراتك الأكاديمية بناءً على بيانات خطتك المتاحة.",
  primary: { label: " انشاء حساب طالب", href: "#cta" },
  secondary: { label: "اكتشف المزايا", href: "#features" },
  chips: ["أنجزت 3 مهام اليوم", "جلسة تركيز: 25 دقيقة"],
};

const sampleCourses = [
  {
    name: "قواعد البيانات",
    status: "recommended",
    reason: "أنهيت متطلبها السابق، وهي شرط لمساقات متقدمة في تخصصك.",
  },
  {
    name: "الإحصاء التطبيقي",
    status: "recommended",
    reason: "يخفف عبء الفصل ويناسب جدولك الصباحي.",
  },
  {
    name: "تعلّم الآلة",
    status: "postpone",
    reason: "يحتاج أساسًا في الإحصاء، الأفضل أخذه بعد الفصل القادم.",
  },
];

const d = (ms: number) => ({ animationDelay: `${ms}ms` });

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden py-[72px] pb-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 start-[-80px] h-72 w-72 animate-float rounded-full bg-accent-mint/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 end-[-60px] h-64 w-64 animate-float-slow rounded-full bg-accent-soft blur-3xl"
      />
      <Container className="relative flex flex-wrap items-center justify-between gap-12">
        <div className="min-w-0 flex-[1_1_440px] gap-4">
          <div className="animate-rise" style={d(0)}>
            <Badge>{hero.badge}</Badge>
          </div>
          <div className="animate-rise" style={d(120)}>
            <Heading as="h1" size="xl" className="mb-4 mt-5">
              {hero.title}
            </Heading>
          </div>
          <p
            className="mb-8 max-w-[520px] animate-rise text-lg text-muted"
            style={d(240)}
          >
            {hero.text}
          </p>
          <div className="flex animate-rise flex-wrap gap-3.5" style={d(360)}>
            <Link to="/register">
              <Button href={hero.primary.href} variant="primary">
                {" "}
                {hero.primary.label} <ArrowLeft size={18} />
              </Button>
            </Link>

            <Button href={hero.secondary.href} variant="secondary">
              {hero.secondary.label}
            </Button>
          </div>
        </div>
        <div className="relative min-w-0 flex-[1_1_400px] animate-rise" style={d(300)}>
          <div className="rounded-2xl border border-line bg-white p-7 shadow-[0_20px_50px_rgba(11,31,58,0.10)]">
            <div className="mb-4 flex items-center justify-between">
              <strong className="text-lg">توصيات الفصل القادم</strong>
              <span className="text-[13px] text-muted">مثال توضيحي</span>
            </div>
            {sampleCourses.map((c, i) => (
              <CourseItem key={c.name} delay={900 + i * 450} {...c} />
            ))}
          </div>
          <div className="absolute -top-5 end-2 flex animate-float items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold shadow-lg sm:-end-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white">
              <Icon name="check" size={14} />
            </span>
            {hero.chips[0]}
          </div>
          <div className="absolute -bottom-5 start-2 flex animate-float-slow items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold shadow-lg sm:-start-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-accent-mint">
              <Icon name="timer" size={14} />
            </span>
            {hero.chips[1]}
          </div>
        </div>
      </Container>
    </section>
  );
}
