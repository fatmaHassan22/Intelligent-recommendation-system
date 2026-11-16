import type { MoodleItem } from "../integrations/types";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronRight,
  ChevronLeft,
  Plus,
  CalendarDays,
  Clock3,
  CheckCircle2,
  Trash2,
  Pencil,
} from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type { Result } from "../../shared/api/types";
import type { PersonalEvent, CalendarData, Task } from "./api";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Modal,
  Notice,
  PageHeader,
  Skeleton,
  useToast,
  iconButtonClass,
} from "../../shared/ui";
import {
  prefix,
  useProductivityQuery,
  useProductivityRefresh,
  useTimezone,
} from "./hooks";
import {
  addDays,
  dateKey,
  dayLabel,
  localDayStart,
  monthShift,
  timestampLabel,
} from "./time";
import { TaskEditor } from "./TaskEditor";
import { priorityLabel, statusLabel } from "./labels";
import { EventEditor } from "./EventEditor";

export function CalendarPage() {
  const zone = useTimezone(),
    refresh = useProductivityRefresh(),
    toast = useToast(),
    [search, setSearch] = useSearchParams();
  const requested = search.get("date") ?? "",
    parsedDate = new Date(requested + "T12:00:00Z");
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(requested) &&
    Number.isFinite(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === requested &&
    requested >= "2000-01-01" &&
    requested <= "2199-12-31";
  const initial = validDate ? requested : dateKey(new Date(), zone);
  const [day, setDay] = useState(initial),
    [view, setView] = useState<"MONTH" | "WEEK" | "DAY">("MONTH"),
    [creatingTask, setCreatingTask] = useState(false),
    [editor, setEditor] = useState<PersonalEvent | "NEW" | null>(null),
    [selectedEvent, setSelectedEvent] = useState<PersonalEvent | null>(null),
    [deleting, setDeleting] = useState<PersonalEvent | null>(null);
  const firstMonth = day.slice(0, 8) + "01",
    monthDow = new Date(firstMonth + "T12:00:00Z").getUTCDay(),
    weekDow = new Date(day + "T12:00:00Z").getUTCDay(),
    first =
      view === "MONTH"
        ? addDays(firstMonth, -monthDow)
        : view === "WEEK"
          ? addDays(day, -weekDow)
          : day,
    count = view === "MONTH" ? 42 : view === "WEEK" ? 7 : 1;
  const days = Array.from({ length: count }, (_, i) => addDays(first, i)),
    from = localDayStart(first, zone),
    to = localDayStart(addDays(first, count), zone);
  const q = useProductivityQuery<Result<CalendarData>>(
      "calendar",
      "/calendar?" + new URLSearchParams({ from, to }),
    ),
    eventId = search.get("event"),
    linked = useProductivityQuery<Result<PersonalEvent>>(
      "event",
      "/calendar/events/" + eventId,
      !!eventId,
    );
  const taskItems = (key: string) =>
    q.data?.data.tasks.filter(
      (t) => t.due_at && dateKey(new Date(t.due_at), zone) === key,
    ) ?? [];
  const moodleItems = (key: string) =>
    q.data?.data.moodle_events?.filter(
      (m) => m.due_at && dateKey(new Date(m.due_at), zone) === key,
    ) ?? [];
  const agendaMoodle = (m: MoodleItem) => (
    <Link
      className="agenda-item moodle"
      key={"moodle" + m.id}
      to={`/app/moodle?item=${m.id}`}
    >
      <CalendarDays size={20} />
      <div>
        <strong>{m.title}</strong>
        <small>
          {timestampLabel(m.due_at, zone)} · {m.course_name}
        </small>
      </div>
      <Badge tone="blue">Moodle</Badge>
    </Link>
  );
  const eventItems = (key: string) => {
    const begin = Date.parse(localDayStart(key, zone)),
      end = Date.parse(localDayStart(addDays(key, 1), zone));
    return (
      q.data?.data.events.filter(
        (e) => Date.parse(e.start_at) < end && Date.parse(e.end_at) > begin,
      ) ?? []
    );
  };
  const move = (direction: number) =>
    setDay(
      view === "MONTH"
        ? monthShift(day, direction)
        : addDays(day, direction * (view === "WEEK" ? 7 : 1)),
    );
  const activeEvent = selectedEvent ?? linked.data?.data ?? null;
  const closeEvent = () => {
    setSelectedEvent(null);
    if (eventId) {
      const next = new URLSearchParams(search);
      next.delete("event");
      setSearch(next);
    }
  };
  const remove = useMutation({
    mutationFn: () =>
      api.mutate(prefix + "/calendar/events/" + deleting!.id, "DELETE", {
        expected_revision: deleting!.revision,
      }),
    onSuccess: async () => {
      setDeleting(null);
      closeEvent();
      await refresh();
      toast("حُذف الحدث الشخصي.");
    },
    onError: (e) => {
      toast(errorMessage(e), "error");
      void refresh();
    },
  });
  const openEvent = (e: PersonalEvent) => setSelectedEvent(e);
  const agendaTask = (task: Task) => (
    <Link
      className={`agenda-item task ${task.status === "COMPLETED" ? "completed" : ""}`}
      key={"task" + task.id}
      to={`/app/tasks/${task.id}`}
    >
      <CheckCircle2 size={20} />
      <div>
        <strong>{task.title}</strong>
        <small>
          {task.due_time
            ? timestampLabel(task.due_at, zone)
            : `نهاية ${dayLabel(task.due_date!)} بتوقيت ${task.timezone}`}{" "}
          · {statusLabel[task.status]}
        </small>
        {task.course_code && <bdi>{task.course_code}</bdi>}
      </div>
      <Badge tone={task.is_overdue || task.priority === "HIGH" ? "amber" : "neutral"}>
        {task.is_overdue ? "متأخرة" : priorityLabel[task.priority]}
      </Badge>
    </Link>
  );
  const agendaEvent = (e: PersonalEvent) => (
    <button
      className="agenda-item event"
      key={"event" + e.id}
      onClick={() => openEvent(e)}
    >
      <CalendarDays size={20} />
      <div>
        <strong>{e.title}</strong>
        <small>
          {e.all_day
            ? "طوال اليوم"
            : timestampLabel(e.start_at, zone) + " – " + timestampLabel(e.end_at, zone)}
        </small>
        {e.course_code && <bdi>{e.course_code}</bdi>}
      </div>
      <Badge tone="blue">حدث شخصي</Badge>
    </button>
  );
  return (
    <>
      <PageHeader
        eyebrow="مواعيدك في مكان واحد"
        title="التقويم"
        description="مواعيد المهام تُحدّث تلقائيًا، والأحداث الشخصية تبقى منفصلة عن الجدول الجامعي الرسمي."
        action={
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => setCreatingTask(true)}>
              <Plus size={16} />
              مهمة في هذا اليوم
            </Button>
            <Button onClick={() => setEditor("NEW")}>
              <Plus size={16} />
              حدث شخصي
            </Button>
          </div>
        }
      />
      <div className="calendar-toolbar">
        <div className="inline-actions">
          <button
            className={iconButtonClass()}
            aria-label="الفترة السابقة"
            onClick={() => move(-1)}
          >
            <ChevronRight />
          </button>
          <h2>
            {view === "MONTH"
              ? dayLabel(firstMonth, { month: "long", year: "numeric" })
              : view === "WEEK"
                ? `${dayLabel(first)} – ${dayLabel(addDays(first, 6))}`
                : dayLabel(day, { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <button
            className={iconButtonClass()}
            aria-label="الفترة التالية"
            onClick={() => move(1)}
          >
            <ChevronLeft />
          </button>
          <Button variant="secondary" onClick={() => setDay(dateKey(new Date(), zone))}>
            اليوم
          </Button>
        </div>
        <div className="productivity-tabs">
          {[
            ["MONTH", "شهر"],
            ["WEEK", "أسبوع"],
            ["DAY", "يوم"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={view === key ? "active" : ""}
              aria-pressed={view === key}
              onClick={() => setView(key as typeof view)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="calendar-legend">
        <span>
          <i className="task-dot" />
          مهمة
        </span>
        <span>
          <i className="event-dot" />
          حدث شخصي
        </span>
        <span>
          <i className="moodle-dot" />
          Moodle
        </span>
        <span>
          التوقيت: <bdi>{zone}</bdi>
        </span>
      </div>
      {q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.isPending ? (
        <Skeleton />
      ) : (
        <>
          {view !== "DAY" && (
            <section
              className={`surface calendar-surface ${view === "WEEK" ? "weekly-view" : ""}`}
            >
              <div className="calendar-scroll">
                <div className="calendar-weekdays">
                  {[
                    "الأحد",
                    "الإثنين",
                    "الثلاثاء",
                    "الأربعاء",
                    "الخميس",
                    "الجمعة",
                    "السبت",
                  ].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className="calendar-grid">
                  {days.map((key) => {
                    const tasks = taskItems(key),
                      events = eventItems(key),
                      moodles = moodleItems(key);
                    return (
                      <div
                        className={`calendar-day ${key === day ? "selected" : ""} ${key.slice(0, 7) !== day.slice(0, 7) && view === "MONTH" ? "outside" : ""} ${key === dateKey(new Date(), zone) ? "today" : ""}`}
                        key={key}
                      >
                        <button
                          className="day-number"
                          aria-label={`عرض يوم ${key}`}
                          aria-pressed={day === key}
                          onClick={() => setDay(key)}
                        >
                          {Number(key.slice(-2))}
                        </button>
                        <div className="calendar-items">
                          {tasks.slice(0, view === "MONTH" ? 2 : 10).map((t) => (
                            <Link
                              className={`calendar-chip task ${t.status === "COMPLETED" ? "completed" : ""}`}
                              key={"task" + t.id}
                              title={`${t.title} · ${priorityLabel[t.priority]} · ${statusLabel[t.status]}`}
                              to={`/app/tasks/${t.id}`}
                            >
                              <i
                                className={t.priority === "HIGH" ? "priority-high" : ""}
                              />
                              {t.title}
                            </Link>
                          ))}
                          {events.slice(0, view === "MONTH" ? 2 : 10).map((e) => (
                            <button
                              className="calendar-chip event"
                              key={"event" + e.id}
                              title={e.title}
                              onClick={() => openEvent(e)}
                            >
                              {e.title}
                            </button>
                          ))}
                          {moodles.slice(0, view === "MONTH" ? 2 : 10).map((m) => (
                            <Link
                              className="calendar-chip moodle"
                              key={"moodle" + m.id}
                              title={m.title + " · Moodle"}
                              to={`/app/moodle?item=${m.id}`}
                            >
                              {m.title}
                            </Link>
                          ))}
                          {view === "MONTH" &&
                            tasks.length + events.length + moodles.length > 4 && (
                              <button
                                className="calendar-more"
                                onClick={() => setDay(key)}
                              >
                                عرض المزيد (
                                {tasks.length + events.length + moodles.length})
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
          <section className="surface daily-agenda">
            <div className="section-heading">
              <div>
                <span className="section-kicker">أجندة اليوم المختار</span>
                <h2>
                  {dayLabel(day, { weekday: "long", day: "numeric", month: "long" })}
                </h2>
              </div>
              <Clock3 size={22} />
            </div>
            {taskItems(day).map(agendaTask)}
            {eventItems(day).map(agendaEvent)}
            {moodleItems(day).map(agendaMoodle)}
            {!taskItems(day).length &&
              !eventItems(day).length &&
              !moodleItems(day).length && (
                <Empty
                  title="لا مواعيد في هذا اليوم"
                  description="أضف مهمة أو حدثًا شخصيًا ليظهر هنا."
                />
              )}
          </section>
        </>
      )}
      {eventId && linked.error && !selectedEvent && (
        <Modal title="تفاصيل الحدث" onClose={closeEvent}>
          <ErrorState error={linked.error} />
        </Modal>
      )}
      {activeEvent && !editor && (
        <Modal title={activeEvent.title} onClose={closeEvent}>
          <Badge tone="blue">حدث شخصي</Badge>
          <p className="event-description">
            {activeEvent.description || "لا يوجد وصف إضافي."}
          </p>
          <p>
            {activeEvent.all_day
              ? "حدث طوال اليوم"
              : timestampLabel(activeEvent.start_at, zone) +
                " – " +
                timestampLabel(activeEvent.end_at, zone)}
          </p>
          <p className="muted">{activeEvent.course_name}</p>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => setEditor(activeEvent)}>
              <Pencil size={16} />
              تعديل الحدث
            </Button>
            <Button variant="danger" onClick={() => setDeleting(activeEvent)}>
              <Trash2 size={16} />
              حذف الحدث
            </Button>
          </div>
        </Modal>
      )}
      {creatingTask && (
        <TaskEditor day={day} onClose={() => setCreatingTask(false)} />
      )}{" "}
      {editor && (
        <EventEditor
          event={editor === "NEW" ? undefined : editor}
          day={day}
          onClose={() => {
            setEditor(null);
            closeEvent();
          }}
        />
      )}{" "}
      {deleting && (
        <Confirm
          title="حذف الحدث الشخصي؟"
          description={`سيُحذف «${deleting.title}» من تقويمك، وتُخفى تذكيراته.`}
          busy={remove.isPending}
          onConfirm={() => remove.mutate()}
          onClose={() => setDeleting(null)}
        />
      )}
      <Notice>
        التذكيرات داخل التطبيق فقط. مواعيد Moodle تظهر فقط بعد نجاح الربط المصرّح به، وتبقى
        منفصلة عن مهامك وأحداثك الشخصية.
      </Notice>
    </>
  );
}
