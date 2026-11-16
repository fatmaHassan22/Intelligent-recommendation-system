import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { Badge, ErrorState, Notice, PageHeader, Skeleton } from "../../shared/ui";
import type { Streak } from "./types";
import { useEngagement } from "./hooks";

export function StreakCard({ value }: { value: Streak }) {
  return (
    <section className="surface streak-card">
      <div className="section-heading">
        <h2>
          <Flame size={22} /> سلسلة الاستمرارية
        </h2>
        <Badge tone="teal">نشاط حقيقي</Badge>
      </div>
      <div className="eng-streak-numbers">
        <div>
          <strong>{value.current_streak}</strong>
          <span>أيام متتالية حاليًا</span>
        </div>
        <div>
          <strong>{value.longest_streak}</strong>
          <span>أطول سلسلة</span>
        </div>
      </div>
      <div className="eng-week" aria-label="نشاط آخر سبعة أيام">
        {value.weekly_activity.map((d) => (
          <div
            className={d.active ? "active" : ""}
            key={d.date}
            title={d.date}
            aria-label={`${d.date}: ${d.active ? "نشاط مسجل" : "دون نشاط"}`}
          >
            <span>
              {new Date(d.date + "T12:00:00Z").toLocaleDateString("ar", {
                weekday: "short",
                timeZone: "UTC",
              })}
            </span>
            <b>{d.active ? "✓" : "·"}</b>
            <small>{d.date.slice(8)}</small>
          </div>
        ))}
      </div>
      <p>{value.message}</p>
      <small>
        آخر نشاط: {value.last_activity_date ?? "لم يبدأ بعد"} · {value.timezone}
      </small>
      <p className="helper">{value.history_note}</p>
    </section>
  );
}

export function StreakPage() {
  const q = useEngagement<Streak>("/streaks");
  return (
    <>
      <PageHeader
        eyebrow="خطوة كل يوم"
        title="الاستمرارية"
        description="المهام المكتملة، التركيز المكتمل، تعديل خطة تحتوي مساقات، وإعلان اجتياز مساق؛ الزيارة وحدها لا تُحسب."
      />
      {q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.isPending ? (
        <Skeleton />
      ) : (
        <>
          <StreakCard value={q.data} />
          <section className="surface">
            <h2>المحطة القادمة</h2>
            <p>ثلاثة أيام تفتح شارة المتعلّم المستمر، وسبعة أيام تفتح بطل الأسبوع.</p>
            <progress
              aria-label="التقدم نحو شارة الاستمرارية التالية"
              value={Math.min(q.data.longest_streak, q.data.longest_streak < 3 ? 3 : 7)}
              max={q.data.longest_streak < 3 ? 3 : 7}
            />
            <Link to="/app/achievements">استكشف شاراتك</Link>
          </section>
          <Notice>
            أكثر من نشاط في اليوم نفسه يُحسب يومًا واحدًا. إذا فات يوم كامل تبدأ السلسلة
            التالية من جديد، وتبقى أطول سلسلة محفوظة. إعادة إكمال المهمة نفسها أو إعادة
            إعلان المساق نفسه لا تنشئ إنجازًا إضافيًا.
          </Notice>
        </>
      )}
    </>
  );
}
