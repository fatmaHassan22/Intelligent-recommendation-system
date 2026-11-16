import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Coffee,
  Settings2,
  CheckCircle2,
} from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type { Result, User } from "../../shared/api/types";
import type {
  ActiveResponse,
  FocusStats,
  PomodoroSettings,
  TaskPage,
  TimerMode,
} from "./api";
import {
  Badge,
  Button,
  Confirm,
  ErrorState,
  Notice,
  PageHeader,
  Select,
  Skeleton,
  Stat,
  number,
  useToast,
} from "../../shared/ui";
import {
  prefix,
  useActiveSession,
  useProductivityQuery,
  useProductivityRefresh,
  useTimezone,
} from "./hooks";
import { timerLabel, dayLabel } from "./time";
import { CourseSelect } from "./CourseSelect";
import { timerModeLabel, useTimerDisplay } from "./timer";
import { SettingsEditor } from "./SettingsEditor";

export function PomodoroPage() {
  const zone = useTimezone(),
    toast = useToast(),
    refresh = useProductivityRefresh(),
    client = useQueryClient(),
    [search] = useSearchParams(),
    active = useActiveSession(),
    remaining = useTimerDisplay(active.data);
  const config = useProductivityQuery<Result<PomodoroSettings>>(
      "pomodoro-settings",
      "/pomodoro/settings",
    ),
    statistics = useProductivityQuery<Result<FocusStats>>(
      "pomodoro-statistics",
      "/pomodoro/statistics?timezone=" + encodeURIComponent(zone),
    ),
    tasks = useProductivityQuery<TaskPage>(
      "pomodoro-tasks",
      "/tasks?limit=100&sort=CREATED&timezone=" + encodeURIComponent(zone),
    );
  const [mode, setMode] = useState<TimerMode>("FOCUS"),
    [taskId, setTaskId] = useState(search.get("task") ?? ""),
    [course, setCourse] = useState(""),
    [settingsOpen, setSettingsOpen] = useState(false),
    [cancelling, setCancelling] = useState(false),
    attempted = useRef<string | null>(null);
  const session = active.data?.data,
    live = session && ["RUNNING", "PAUSED"].includes(session.state) ? session : null;
  const associationTask = live ? (live.task_id ?? "") : taskId;
  const linkedTask = useProductivityQuery<Result<import("./api").Task>>(
    "pomodoro-linked-task",
    "/tasks/" + associationTask,
    !!associationTask,
  );
  const requestOwner = client.getQueryData<User | null>(["auth"])?.id;
  const accept = async (response: ActiveResponse) => {
    if (client.getQueryData<User | null>(["auth"])?.id !== requestOwner) return;
    if (response.data?.state === "COMPLETED")
      toast(
        response.data.mode === "FOCUS"
          ? "انتهت جلسة التركيز وحُفظت دقائقها."
          : "انتهت الاستراحة.",
      );
    await refresh();
  };
  const start = useMutation({
    mutationFn: () =>
      api.mutate<ActiveResponse>(prefix + "/pomodoro/sessions", "POST", {
        mode,
        task_id: mode === "FOCUS" && taskId ? taskId : null,
        course_code: mode === "FOCUS" && course ? course : null,
      }),
    onSuccess: async (r) => {
      attempted.current = null;
      await accept(r);
      toast("بدأت الجلسة وحُفظت حالتها في الخادم.");
    },
    onError: (e) => {
      toast(errorMessage(e), "error");
      void active.refetch();
    },
  });
  const action = useMutation({
    mutationFn: (kind: "PAUSE" | "RESUME" | "CANCEL" | "COMPLETE") =>
      api.mutate<ActiveResponse>(
        prefix + `/pomodoro/sessions/${session!.id}/actions`,
        "POST",
        { action: kind, expected_revision: session!.revision },
      ),
    onSuccess: async (r, kind) => {
      setCancelling(false);
      await accept(r);
      if (kind === "CANCEL" && r.data?.state === "CANCELLED")
        toast("أُلغيت الجلسة؛ لن تدخل في دقائق التركيز المكتملة.");
    },
    onError: (e) => {
      toast(errorMessage(e), "error");
      void active.refetch();
    },
  });
  useEffect(() => {
    if (
      session?.state === "RUNNING" &&
      remaining === 0 &&
      !action.isPending &&
      attempted.current !== session.id
    ) {
      attempted.current = session.id;
      action.mutate("COMPLETE");
    }
  }, [session?.id, session?.state, session?.revision, remaining, action.isPending]);
  const duration =
      live?.duration_ms ??
      (mode === "FOCUS"
        ? (config.data?.data.focus_minutes ?? 25)
        : mode === "SHORT_BREAK"
          ? (config.data?.data.short_break_minutes ?? 5)
          : (config.data?.data.long_break_minutes ?? 15)) * 60000,
    display = live ? remaining : duration,
    progress = live ? Math.min(100, Math.max(0, (1 - remaining / duration) * 100)) : 0,
    busy = start.isPending || action.isPending;
  const stats = statistics.data?.data,
    max = Math.max(1, ...(stats?.daily.map((d) => d.focus_minutes) ?? []));
  return (
    <>
      <PageHeader
        eyebrow="وقت قصير، انتباه كامل"
        title="بومودورو"
        description="جلسة تركيز واحدة في كل مرة. الوقت المتبقي محفوظ ويستعاد عند العودة إلى التطبيق."
        action={
          <Button
            variant="secondary"
            disabled={!config.data}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 size={17} />
            إعدادات الجلسات
          </Button>
        }
      />
      <div className="pomodoro-layout">
        <section className="surface pomodoro-main">
          <div className="productivity-tabs timer-tabs">
            {Object.entries(timerModeLabel).map(([key, label]) => (
              <button
                key={key}
                disabled={!!live || busy}
                aria-pressed={(live?.mode ?? mode) === key}
                className={(live?.mode ?? mode) === key ? "active" : ""}
                onClick={() => setMode(key as TimerMode)}
              >
                {label}
              </button>
            ))}
          </div>
          {active.error || config.error ? (
            <ErrorState
              error={active.error ?? config.error}
              retry={() => {
                void active.refetch();
                void config.refetch();
              }}
            />
          ) : active.isPending || config.isPending ? (
            <Skeleton />
          ) : (
            <>
              <div
                className={`timer-ring${live?.state === "RUNNING" ? " is-running" : live?.state === "PAUSED" ? " is-paused" : ""}`}
                style={{
                  background: `conic-gradient(var(--teal) ${progress}%, var(--app-panel-2, #e8efef) ${progress}%)`,
                }}
                role="progressbar"
                aria-label="تقدم جلسة بومودورو"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
              >
                <div>
                  <span className="timer-mode">
                    {(live?.mode ?? mode) === "FOCUS" ? (
                      <Timer size={20} />
                    ) : (
                      <Coffee size={20} />
                    )}{" "}
                    {timerModeLabel[live?.mode ?? mode]}
                  </span>
                  <strong className="timer-number" dir="ltr" aria-label="الوقت المتبقي">
                    {timerLabel(display)}
                  </strong>
                  <Badge tone="teal">
                    {live?.state === "PAUSED"
                      ? "متوقفة مؤقتًا"
                      : live
                        ? "جلسة محفوظة وتعمل"
                        : "جاهزة للبدء"}
                  </Badge>
                </div>
              </div>
              <div className="timer-controls">
                {!live ? (
                  <Button
                    busy={busy}
                    disabled={!config.data}
                    onClick={() => start.mutate()}
                  >
                    <Play size={18} />
                    ابدأ {timerModeLabel[mode]}
                  </Button>
                ) : (
                  <>
                    <Button
                      busy={busy}
                      onClick={() =>
                        action.mutate(live.state === "PAUSED" ? "RESUME" : "PAUSE")
                      }
                    >
                      {live.state === "PAUSED" ? <Play size={18} /> : <Pause size={18} />}{" "}
                      {live.state === "PAUSED" ? "استئناف" : "إيقاف مؤقت"}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setCancelling(true)}
                    >
                      <RotateCcw size={17} />
                      إلغاء وإعادة ضبط
                    </Button>
                  </>
                )}
              </div>
              {!live && active.data?.suggested_break_mode === "LONG_BREAK" && (
                <Button variant="ghost" onClick={() => setMode("LONG_BREAK")}>
                  حان وقت استراحة طويلة
                </Button>
              )}
              {live?.state === "RUNNING" && remaining === 0 && (
                <p role="status">جارٍ تأكيد نهاية الجلسة في الخادم…</p>
              )}
            </>
          )}
          <p className="muted timer-help">
            يمكنك الانتقال لصفحة أخرى. الجلسة الجارية تستمر حتى موعد نهايتها، والمتوقفة
            تبقى متوقفة حتى تستأنفها.
          </p>
        </section>
        <section className="surface focus-context">
          <span className="section-kicker">اختر ما تركزين عليه</span>
          <h2>نية هذه الجلسة</h2>
          <Select
            label="المهمة المرتبطة (اختياري)"
            value={associationTask}
            disabled={!!live || mode !== "FOCUS" || tasks.isPending}
            onChange={(e) => {
              setTaskId(e.target.value);
              setCourse("");
            }}
          >
            <option value="">دون مهمة</option>
            {associationTask &&
              linkedTask.data &&
              !tasks.data?.data.some((t) => t.id === associationTask) && (
                <option value={associationTask}>{linkedTask.data.data.title}</option>
              )}
            {tasks.data?.data.map((t) => (
              <option value={t.id} key={t.id}>
                {t.title}
              </option>
            ))}
          </Select>
          <fieldset disabled={!!live || mode !== "FOCUS"}>
            <CourseSelect
              value={live ? (live.course_code ?? "") : course}
              onChange={setCourse}
              previous={
                live
                  ? {
                      course_code: live.course_code ?? null,
                      course_name: live.course_name ?? null,
                    }
                  : undefined
              }
            />
          </fieldset>
          {live && (
            <Notice>
              ارتباط هذه الجلسة حُفظ عند بدئها. اختر ارتباطًا جديدًا للجلسة القادمة.
            </Notice>
          )}
          <Notice>
            الجلسة الملغاة لا تُحسب. الاستراحات منفصلة عن دقائق الدراسة، والإنجاز لا يغيّر
            حالة المهمة تلقائيًا.
          </Notice>
          <Link to="/app/tasks" className="back-link">
            عرض المهام
          </Link>
        </section>
      </div>
      <section className="focus-statistics">
        <div className="section-heading">
          <h2>وقت التركيز الذي أُنجز</h2>
          <span className="muted">
            التوقيت: <bdi>{zone}</bdi>
          </span>
        </div>
        {statistics.error ? (
          <ErrorState error={statistics.error} retry={() => void statistics.refetch()} />
        ) : statistics.isPending ? (
          <Skeleton />
        ) : (
          <>
            <div className="stats-grid">
              <Stat
                label="تركيز اليوم"
                value={number(stats!.today_focus_minutes)}
                hint="دقيقة من جلسات مكتملة"
                icon={<Timer />}
              />
              <Stat
                label="آخر ٧ أيام"
                value={number(stats!.weekly_focus_minutes)}
                hint="دقيقة تركيز، تشمل اليوم"
                icon={<ClockIcon />}
              />
              <Stat
                label="جلسات التركيز المكتملة"
                value={number(stats!.total_completed_focus_sessions)}
                hint="كل الجلسات المكتملة في حسابك"
                icon={<CheckCircle2 />}
              />
              <Stat
                label="إجمالي دقائق الدراسة"
                value={number(stats!.total_focus_minutes)}
                hint="لا يشمل الاستراحات أو الجلسات الملغاة"
                icon={<Timer />}
              />
            </div>
            <div
              className="surface focus-chart"
              aria-label="دقائق التركيز خلال آخر سبعة أيام"
            >
              {stats!.daily.map((d) => (
                <div className="focus-chart-day" key={d.date}>
                  <strong>{number(d.focus_minutes)}</strong>
                  <div className="focus-bar-track">
                    <div style={{ height: `${(d.focus_minutes / max) * 100}%` }} />
                  </div>
                  <small>{dayLabel(d.date, { weekday: "short", day: "numeric" })}</small>
                </div>
              ))}
            </div>
            {!stats!.total_completed_focus_sessions && (
              <p className="muted">ستظهر دقائقك بعد إكمال أول جلسة تركيز.</p>
            )}
          </>
        )}
      </section>
      {settingsOpen && config.data && (
        <SettingsEditor
          settings={config.data.data}
          onClose={() => setSettingsOpen(false)}
        />
      )}{" "}
      {cancelling && (
        <Confirm
          title="إلغاء الجلسة وإعادة ضبط المؤقت؟"
          description="لن تُحسب هذه الجلسة ضمن الجلسات المكتملة أو دقائق الدراسة. يمكنك بدء جلسة جديدة بعدها."
          busy={busy}
          onConfirm={() => action.mutate("CANCEL")}
          onClose={() => setCancelling(false)}
        />
      )}
    </>
  );
}

function ClockIcon() {
  return <Timer />;
}
