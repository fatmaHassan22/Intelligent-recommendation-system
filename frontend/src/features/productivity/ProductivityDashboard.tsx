import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CheckCircle2, Clock3, Timer, ArrowLeft } from "lucide-react";
import type { Result } from "../../shared/api/types";
import type { ProductivitySummary } from "./api";
import {
  Button,
  Empty,
  ErrorState,
  Skeleton,
  Stat,
  number,
  buttonClass,
} from "../../shared/ui";
import { useProductivityQuery, useTimezone } from "./hooks";
import { timestampLabel, dateKey } from "./time";
import { TaskEditor } from "./TaskEditor";
import { TaskRow } from "./TaskRow";

export function ProductivityDashboard() {
  const zone = useTimezone(),
    q = useProductivityQuery<Result<ProductivitySummary>>(
      "summary",
      "/productivity/summary?timezone=" + encodeURIComponent(zone),
    ),
    [creating, setCreating] = useState(false);
  return (
    <section className="productivity-dashboard">
      <div className="section-heading">
        <div>
          <span className="section-kicker">وقت لإنجازك</span>
          <h2>صورة اليوم</h2>
        </div>
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Plus size={16} />
            مهمة جديدة
          </Button>
          <Link className={buttonClass("primary")} to="/app/pomodoro">
            <Timer size={16} />
            ابدأ التركيز
          </Link>
        </div>
      </div>
      {q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.isPending ? (
        <Skeleton />
      ) : (
        <>
          <div className="stats-grid">
            <Stat
              label="مهام اليوم"
              value={number(q.data.data.today_tasks.length)}
              hint="حسب مواعيد الاستحقاق"
              icon={<CheckCircle2 />}
            />
            <Stat
              label="مهام متأخرة"
              value={number(q.data.data.overdue_count)}
              hint="غير مكتملة وقد تجاوزت الموعد"
              icon={<Clock3 />}
            />
            <Stat
              label="مهام أُنجزت اليوم"
              value={number(q.data.data.completed_today)}
              hint="حسب وقت إكمال المهمة"
              icon={<CheckCircle2 />}
            />
            <Stat
              label="دقائق التركيز اليوم"
              value={number(q.data.data.focus.today_focus_minutes)}
              hint="من جلسات التركيز المكتملة فقط"
              icon={<Timer />}
            />
          </div>
          <div className="dashboard-columns">
            <section className="surface">
              <div className="section-heading">
                <h3>مهام اليوم</h3>
                <Link to="/app/tasks">
                  عرض المهام
                  <ArrowLeft size={15} />
                </Link>
              </div>
              {q.data.data.today_tasks.length ? (
                q.data.data.today_tasks
                  .slice(0, 5)
                  .map((t) => <TaskRow key={t.id} task={t} />)
              ) : (
                <Empty
                  title="يوم بلا مواعيد مهام"
                  description="يمكنك اختيار مهمة دون موعد أو إنشاء واحدة جديدة."
                />
              )}
            </section>
            <section className="surface">
              <h3>مواعيد الاستحقاق القادمة</h3>
              {q.data.data.upcoming_tasks.length ? (
                q.data.data.upcoming_tasks.map((t) => (
                  <Link className="upcoming-item" key={t.id} to={`/app/tasks/${t.id}`}>
                    <span>{t.title}</span>
                    <small>{timestampLabel(t.due_at, zone)}</small>
                  </Link>
                ))
              ) : (
                <Empty
                  title="لا مواعيد قادمة"
                  description="ستظهر هنا المهام التي أُضيف لها موعدًا."
                />
              )}
            </section>
          </div>
        </>
      )}
      {creating && (
        <TaskEditor day={dateKey(new Date(), zone)} onClose={() => setCreating(false)} />
      )}
    </section>
  );
}
