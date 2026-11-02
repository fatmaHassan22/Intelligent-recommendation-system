import Icon from "../components/Icon";
import Badge from "../components/Badge";
import ScreenFrame from "../components/ScreenFrame";
import ChatBubble from "../components/ChatBubble";

// المحتوى النصي لهذا القسم، عدّله هنا مباشرة.
const sampleCourses = [
  { name: "قواعد البيانات", status: "recommended", reason: "أنهيت متطلبها السابق، وهي شرط لمساقات متقدمة في تخصصك." },
  { name: "الإحصاء التطبيقي", status: "recommended", reason: "يخفف عبء الفصل ويناسب جدولك الصباحي." },
  { name: "تعلّم الآلة", status: "postpone", reason: "يحتاج أساسًا في الإحصاء، الأفضل أخذه بعد الفصل القادم." },
];

const ai = {
  explainTitle: "لماذا نوصي بمساق «قواعد البيانات»؟",
  reasons: [
    "أنجزت المتطلب السابق للمساق.",
    "يفتح لك الباب لمساقات متقدمة في الفصول التالية.",
    "يتوافق مع وقتك المتاح دون تعارض مع مساقاتك الأخرى.",
  ],
};

const tryIt = {
  tasks: ["مراجعة ملخص الفصل الثالث", "تسليم تقرير المختبر", "جلسة تركيز لمدة 25 دقيقة", "ترتيب جدول الأسبوع"],
};

const calendar: { days: string[]; events: [string, number][][] } = {
  days: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"],
  // [النص، نوع الحدث: 0 محاضرة/جلسة، 1 اختبار، 2 تسليم]
  events: [[["محاضرة 10:00", 0]], [["اختبار الإحصاء", 1]], [["تسليم التقرير", 2], ["مذاكرة 25 د", 0]], [["محاضرة 12:00", 0]], [["جلسة تركيز", 0]]],
};

const assistant = {
  chat: [
    { from: "user", text: "كيف أوزّع وقتي قبل اختبار الأسبوع القادم؟" },
    { from: "assistant", text: "اقترح تقسيم المراجعة على أيام الأسبوع، وأضيف الجلسات لتقويمك مع تذكير قبل كل جلسة. هل أبدأ؟" },
  ],
};

const chatFollowUp = "تمام، ابدأ بأول جلسة غدًا.";

const eventStyle = ["bg-accent-soft text-accent", "bg-[#FDECEA] text-[#9A3412]", "bg-ink text-white"];

export function CoursesScreen() {
  return (
    <ScreenFrame>
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-3">
          <strong>توصيات الفصل القادم</strong>
          {sampleCourses.map((c) => (
            <div key={c.name} className={`rounded-xl border p-3 ${c.status === "postpone" ? "border-dashed border-[#B8C4D8]" : "border-line"}`}>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[15px]">{c.name}</strong>
                <Badge tone={c.status === "postpone" ? "neutral" : "accent"}>{c.status === "postpone" ? "أجّله" : "مُوصى به"}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted">{c.reason}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-accent-soft p-4">
          <strong>{ai.explainTitle}</strong>
          <div className="mt-3 flex flex-col gap-2.5 text-sm text-muted">
            {ai.reasons.map((r) => (
              <div key={r} className="flex gap-2"><Icon name="check" size={18} className="mt-0.5 flex-none text-accent" /><span>{r}</span></div>
            ))}
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

export function CalendarScreen() {
  return (
    <ScreenFrame>
      <strong>أسبوعك</strong>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {calendar.days.map((d, i) => (
          <div key={d} className="rounded-xl bg-surface p-2">
            <div className="mb-2 text-center text-xs font-semibold text-muted">{d}</div>
            <div className="flex flex-col gap-1.5">
              {calendar.events[i].map(([t, k]) => (
                <div key={t} className={`rounded-lg px-1.5 py-2 text-center text-[11px] font-semibold leading-tight ${eventStyle[k]}`}>{t}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScreenFrame>
  );
}

export function FocusScreen() {
  return (
    <ScreenFrame>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2.5">
          <strong>مهام اليوم</strong>
          {tryIt.tasks.map((t, i) => {
            const d = i < 2;
            return (
              <div key={t} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${d ? "border-accent bg-accent-soft" : "border-line"}`}>
                <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 ${d ? "border-accent bg-accent text-white" : "border-[#B8C4D8]"}`}>
                  {d && <Icon name="check" size={14} />}
                </span>
                <span className={d ? "text-muted line-through" : ""}>{t}</span>
              </div>
            );
          })}
        </div>
        <div className="relative mx-auto h-[150px] w-[150px]">
          <svg viewBox="0 0 128 128" width="150" height="150" className="-rotate-90" aria-hidden="true">
            <circle cx="64" cy="64" r="54" fill="none" stroke="#E3F4F1" strokeWidth="12" />
            <circle cx="64" cy="64" r="54" fill="none" stroke="#0B7A6E" strokeWidth="12" strokeLinecap="round" strokeDasharray="339.29" strokeDashoffset="110" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">18:20</span>
            <span className="text-xs text-muted">جلسة تركيز</span>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}

export function ChatScreen() {
  const [q, a] = assistant.chat;
  return (
    <ScreenFrame>
      <div className="flex flex-col gap-3">
        <ChatBubble from={q.from}>{q.text}</ChatBubble>
        <ChatBubble from={a.from}>{a.text}</ChatBubble>
        <ChatBubble from="user">{chatFollowUp}</ChatBubble>
      </div>
    </ScreenFrame>
  );
}
