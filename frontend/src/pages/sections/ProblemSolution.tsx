import Container from "../components/Container";
import Heading from "../components/Heading";
import Reveal from "../components/Reveal";
import ProblemPair from "../components/ProblemPair";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const problems = {
  title: "الدراسة الجامعية لا يجب أن تُدار بالتخمين",
  text: "هذه الصعوبات يعرفها كل طالب، وهذا ما يغيّره مسار.",
  pairs: [
    {
      problem: "تسجيل المساقات بالتخمين",
      problemText: "تختار مساقاتك من الخطة أو بنصيحة زميل، فتصطدم بمتطلب سابق أو تعارض في الجدول.",
      solution: "توصية مشروحة لكل فصل",
      solutionText: "يحلل سجلك وخطة تخرجك ويقترح المساقات الأنسب مع سبب كل اختيار."
    },
    {
      problem: "مهام ومواعيد مبعثرة",
      problemText: "الواجبات في تطبيق، والاختبارات في ورقة، والتذكيرات في رأسك.",
      solution: "كل شيء في مكان واحد",
      solutionText: "تقويم وقائمة مهام وإشعارات تعمل معًا، فلا يفوتك موعد."
    },
    {
      problem: "ضغط الوقت وفقدان التركيز",
      problemText: "تبدأ المذاكرة متأخرًا وتضيع بين المشتتات.",
      solution: "إيقاع واضح ومحفّز",
      solutionText: "مؤقّت تركيز وتتبّع تقدّم يومي، ومساعد ذكي يجيب حين تتعثر."
    },
  ],
};

export default function ProblemSolution() {
  return (
    <section id="problem" className="border-y border-line bg-white py-20">
      <Container>
        <Reveal className="mx-auto mb-12 max-w-[640px] text-center">
          <Heading className="mb-3">{problems.title}</Heading>
          <p className="text-[17px] text-muted">{problems.text}</p>
        </Reveal>
        <div className="flex flex-col gap-4">
          {problems.pairs.map((p, i) => <ProblemPair key={p.problem} delay={i * 150} {...p} />)}
        </div>
      </Container>
    </section>
  );
}
