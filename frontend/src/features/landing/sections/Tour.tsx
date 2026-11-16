import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Container from "../components/Container";
import Heading from "../components/Heading";
import Reveal from "../components/Reveal";
import { CoursesScreen, CalendarScreen, FocusScreen, ChatScreen } from "./TourScreens";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const tour = {
  title: "جولة داخل المنصة",
  text: "لقطات من الأدوات التي ستستخدمها كل يوم.",
  slides: [
    { title: "توصيات المساقات", text: "اقتراحات الفصل القادم مع شرح سبب كل اختيار." },
    {
      title: "التقويم الدراسي",
      text: "محاضراتك واختباراتك وتسليماتك في أسبوع واحد واضح.",
    },
    {
      title: "المهام ومؤقّت التركيز",
      text: "أنجز مهامك وتابع جلسات المذاكرة بإيقاع ثابت.",
    },
    { title: "المساعد الذكي", text: "اسأل عن موادك أو وقتك واحصل على إجابة فورية." },
  ],
};

const screens = [CoursesScreen, CalendarScreen, FocusScreen, ChatScreen];
const INTERVAL = 4500;

// عرض شرائح: يتغير تلقائيًا، ويتوقف عند المرور أو التركيز، ونقاط للتنقل، وسحب بالإصبع.
export default function Tour() {
  const n = screens.length;
  const [cur, setCur] = useState(0);
  const [paused, setPaused] = useState(false);
  const x0 = useRef<number | null>(null);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!document.hidden) setCur((c) => (c + 1) % n);
    }, INTERVAL);
    return () => clearInterval(t);
  }, [paused, cur, n]);

  const onUp = (e: ReactPointerEvent) => {
    if (x0.current === null) return;
    const dx = e.clientX - x0.current;
    x0.current = null;
    if (Math.abs(dx) > 50) setCur((c) => (c + (dx < 0 ? 1 : n - 1)) % n);
  };

  return (
    <section id="tour" className="border-y border-line bg-white py-20">
      <Container className="max-w-[980px]">
        <Reveal className="mx-auto mb-10 max-w-[620px] text-center">
          <Heading className="mb-3">{tour.title}</Heading>
          <p className="text-[17px] text-muted">{tour.text}</p>
        </Reveal>
        <Reveal>
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label={tour.title}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onPointerDown={(e) => (x0.current = e.clientX)}
            onPointerUp={onUp}
          >
            <div className="overflow-hidden rounded-3xl border border-line bg-surface">
              <div
                dir="ltr"
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${cur * 100}%)` }}
              >
                {screens.map((Screen, i) => (
                  <div
                    key={i}
                    dir="rtl"
                    className="w-full flex-none"
                    aria-hidden={i !== cur}
                  >
                    <Screen />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-xl font-bold">{tour.slides[cur].title}</h3>
              <p aria-live="polite" className="text-muted">
                {tour.slides[cur].text}
              </p>
            </div>
            <div className="mt-3 flex justify-center">
              {tour.slides.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setCur(i)}
                  aria-label={`الصورة ${i + 1}: ${s.title}`}
                  aria-current={i === cur ? "true" : undefined}
                  className="group flex h-8 items-center px-1"
                >
                  <span
                    className={`block h-3 rounded-full transition-all duration-300 ${i === cur ? "w-8 bg-accent" : "w-3 bg-[#C9D3E3] group-hover:bg-[#9FB0C9]"}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
