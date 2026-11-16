import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw, BookOpen, CalendarDays, FileText, Bell } from "lucide-react";
import { api, errorMessage, ApiError } from "../../shared/api/client";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Notice,
  PageHeader,
  Skeleton,
  useToast,
} from "../../shared/ui";
import { integrationPrefix, useIntegration, useIntegrationRefresh } from "./hooks";
import type { MoodleStatus, MoodleCourse, MoodleItem, SyncRun } from "./types";
export const moodleStateLabels: Record<MoodleStatus["state"], string> = {
  NOT_CONFIGURED: "الربط غير مهيأ",
  CONFIGURED: "الإعداد محفوظ — يحتاج التحقق",
  CONNECTED: "متصل",
  AUTHENTICATION_FAILED: "تعذر التحقق من التصريح",
  PERMISSION_DENIED: "الصلاحيات غير كافية",
  SYNC_ERROR: "تعذرت المزامنة",
};
export const moodleKindLabels: Record<MoodleItem["kind"], string> = {
  ASSIGNMENT: "واجب",
  QUIZ: "اختبار",
  ANNOUNCEMENT: "إعلان",
  CALENDAR: "موعد من Moodle",
  MATERIAL: "بيانات مادة تعليمية",
};
const date = (s: string | null) =>
  s
    ? new Date(s).toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" })
    : "لا توجد مزامنة مسجلة";
export function MoodlePage() {
  const status = useIntegration<MoodleStatus>("/moodle/status"),
    courses = useIntegration<MoodleCourse[]>("/moodle/courses"),
    items = useIntegration<MoodleItem[]>("/moodle/events"),
    history = useIntegration<SyncRun[]>("/moodle/history"),
    [tab, setTab] = useState("ALL"),
    [disconnect, setDisconnect] = useState(false),
    refresh = useIntegrationRefresh(),
    toast = useToast();
  const sync = useMutation({
    mutationFn: () => api.mutate(integrationPrefix + "/moodle/sync", "POST"),
    onSuccess: async () => {
      await refresh();
      toast("اكتملت مزامنة معلومات Moodle المسموح بها.");
    },
    onError: async (e) => {
      await refresh();
      toast(errorMessage(e), "error");
    },
  });
  const unlink = useMutation({
    mutationFn: () => api.mutate(integrationPrefix + "/moodle/disconnect", "POST"),
    onSuccess: async () => {
      setDisconnect(false);
      await refresh();
      toast("أُوقف الربط وحُذف التصريح المشفّر.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const preference = useMutation({
    mutationFn: (value: boolean | string[]) =>
      api.mutate(
        integrationPrefix + "/moodle/preferences",
        "PATCH",
        typeof value === "boolean"
          ? { notifications_enabled: value }
          : {
              notifications_enabled: status.data?.notifications_enabled ?? true,
              notification_categories: value,
            },
      ),
    onSuccess: () => refresh(),
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const monitoring = useMutation({
    mutationFn: (enabled: boolean) =>
      api.mutate(integrationPrefix + "/moodle/monitoring", "POST", { enabled }),
    onSuccess: () => refresh(),
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const categories = Object.keys(moodleKindLabels);
  const visible = items.data?.filter((i) => tab === "ALL" || i.kind === tab) ?? [];
  return (
    <>
      <PageHeader
        eyebrow="المصدر الجامعي، عند توفره"
        title="Moodle"
        description="مساقات ومواعيد وإعلانات وبيانات مواد تعليمية من الربط المؤسسي المصرّح به."
        action={
          <Button
            busy={sync.isPending}
            disabled={!status.data?.can_sync}
            onClick={() => sync.mutate()}
          >
            <RefreshCw size={17} />
            مزامنة الآن
          </Button>
        }
      />
      {status.error ? (
        <ErrorState error={status.error} retry={() => void status.refetch()} />
      ) : status.isPending ? (
        <Skeleton />
      ) : (
        <section className="surface moodle-status">
          <div className="section-heading">
            <h2>حالة الاتصال</h2>
            <Badge
              tone={
                status.data.state === "CONNECTED"
                  ? "teal"
                  : status.data.state === "NOT_CONFIGURED"
                    ? "neutral"
                    : "amber"
              }
            >
              {moodleStateLabels[status.data.state]}
            </Badge>
          </div>
          {status.data.state === "NOT_CONFIGURED" ? (
            <Empty
              title="الربط الجامعي غير متاح بعد"
              description="لم تُجهز بيانات الاتصال أو التصريح المؤسسي لحسابك. لا نطلب كلمة مرور Moodle، ولن نعرض مساقات أو واجبات تجريبية. بقية ميزات التطبيق تعمل كالمعتاد."
            />
          ) : (
            <>
              <p>
                آخر مزامنة ناجحة: <strong>{date(status.data.last_success_at)}</strong>
              </p>
              <p>آخر محاولة: {date(status.data.last_attempt_at)}</p>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={!!status.data.monitoring_opt_in}
                  disabled={monitoring.isPending}
                  onChange={(e) => monitoring.mutate(e.target.checked)}
                />
                أوافق على متابعة Moodle تلقائيًا لحسابي كل ست ساعات عند توفر الربط المصرح
              </label>
              <p>
                المزامنة التلقائية:{" "}
                {status.data.automatic_sync
                  ? `كل ${status.data.sync_interval_minutes / 60} ساعات`
                  : "متوقفة"}
              </p>
              {status.data.error_code && (
                <p className="form-error">
                  {errorMessage(new ApiError(status.data.error_code, 502))} · راجع مسؤول
                  الربط للتحقق من التصريح والصلاحيات. البيانات المتزامنة لا تُعرض حتى يعود
                  الاتصال الناجح.
                </p>
              )}
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={status.data.notifications_enabled}
                  disabled={preference.isPending}
                  onChange={(e) => preference.mutate(e.target.checked)}
                />
                إشعارات الإعلانات والمواعيد الجديدة من Moodle
              </label>
              {categories.map((kind) => (
                <label className="check-field" key={kind}>
                  <input
                    type="checkbox"
                    checked={(status.data.notification_categories ?? categories).includes(
                      kind,
                    )}
                    disabled={preference.isPending}
                    onChange={(e) => {
                      const selected = new Set(
                        status.data.notification_categories ?? categories,
                      );
                      if (e.target.checked) selected.add(kind);
                      else selected.delete(kind);
                      preference.mutate([...selected]);
                    }}
                  />
                  {moodleKindLabels[kind as MoodleItem["kind"]]}
                </label>
              ))}
              <Button variant="secondary" onClick={() => setDisconnect(true)}>
                إيقاف الربط وحذف التصريح
              </Button>
            </>
          )}
          {status.data.state === "CONNECTED" && (
            <p className="helper">
              المعلومات من آخر مزامنة ناجحة. ما لا تسمح به وظائف المؤسسة لا يُعرض أو يُخمن.
            </p>
          )}
        </section>
      )}
      <Notice>
        ربط المتصفح بجامعة الأقصى غير مفعّل: نحتاج تصريح المؤسسة وفحصًا مصرحًا بعد الدخول. لا
        ترسلي كلمة المرور أو cookies أو tokens في المحادثة. الربط الحالي يستخدم API مؤسسيًا
        فقط إذا أتاحته الجامعة.
      </Notice>
      <section className="surface">
        <div className="section-heading">
          <h2>
            <BookOpen size={20} /> المساقات المتزامنة
          </h2>
          <small>مستقلة عن كتالوج خطتك الأكاديمية</small>
        </div>
        {courses.error ? (
          <ErrorState error={courses.error} retry={() => void courses.refetch()} />
        ) : courses.isPending ? (
          <Skeleton />
        ) : courses.data.length ? (
          <div className="moodle-course-grid">
            {courses.data.map((c) => (
              <article className="moodle-course" key={c.external_id}>
                <h3>{c.name}</h3>
                <bdi>{c.shortname}</bdi>
                {c.source_url && (
                  <a href={c.source_url} target="_blank" rel="noopener noreferrer">
                    فتح المساق في Moodle ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="لا مساقات Moodle متاحة"
            description="تظهر هنا فقط المساقات المصرّح بها بعد نجاح المزامنة."
          />
        )}
      </section>
      <section className="surface">
        <div className="section-heading">
          <h2>معلوماتك المتزامنة</h2>
          <Link to="/app/calendar">عرض التقويم</Link>
        </div>
        <div className="productivity-tabs moodle-tabs">
          {[["ALL", "الكل"], ...Object.entries(moodleKindLabels)].map(([key, label]) => (
            <button
              aria-pressed={tab === key}
              className={tab === key ? "active" : ""}
              key={key}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {items.error ? (
          <ErrorState error={items.error} retry={() => void items.refetch()} />
        ) : items.isPending ? (
          <Skeleton />
        ) : visible.length ? (
          visible.map((i) => (
            <article className="moodle-item" key={i.id}>
              <span>
                {i.kind === "ANNOUNCEMENT" ? (
                  <Bell size={22} />
                ) : i.kind === "MATERIAL" ? (
                  <FileText size={22} />
                ) : (
                  <CalendarDays size={22} />
                )}
              </span>
              <div>
                <Badge tone="blue">Moodle · {moodleKindLabels[i.kind]}</Badge>
                <h3>{i.title}</h3>
                <small>{i.course_name}</small>
                <p dir="auto">{i.description}</p>
                {i.due_at && <p>الموعد: {date(i.due_at)}</p>}
                {i.kind === "MATERIAL" && (
                  <small>
                    بيانات وصفية فقط؛ لم يُنزّل الملف أو يُرسل محتواه إلى المساعد.
                  </small>
                )}
                {i.source_url && (
                  <a href={i.source_url} target="_blank" rel="noopener noreferrer">
                    فتح المصدر في Moodle ↗
                  </a>
                )}
              </div>
            </article>
          ))
        ) : (
          <Empty
            title="لا معلومات في هذا العرض"
            description="قد تكون هذه الوظائف غير مفعّلة أو غير مصرّح بها في المؤسسة؛ لا نختلق بيانات بديلة."
          />
        )}
      </section>
      <section className="surface">
        <h2>سجل المزامنة</h2>
        {history.error ? (
          <ErrorState error={history.error} retry={() => void history.refetch()} />
        ) : history.isPending ? (
          <Skeleton />
        ) : history.data.length ? (
          history.data.map((h) => (
            <div className="sync-history" key={h.id}>
              <span>{date(h.started_at)}</span>
              <Badge tone={h.status === "COMPLETED" ? "teal" : "amber"}>
                {h.status === "COMPLETED"
                  ? "نجحت"
                  : h.status === "RUNNING"
                    ? "جارٍ التنفيذ"
                    : "تعذرت"}
              </Badge>
              <small>{h.trigger_type === "MANUAL" ? "طلب يدوي" : "مجدولة"}</small>
              {h.error_code && <small>راجع حالة الربط والصلاحيات.</small>}
            </div>
          ))
        ) : (
          <p className="muted">لم تُنفذ مزامنة بعد.</p>
        )}
      </section>
      <Notice>
        المزامنة للقراءة فقط. لا تُعدل المساقات الأكاديمية أو سجلات الإنجاز، ولا تُنزّل ملفات
        فعلية. إرسال معلومات محدودة إلى Gemini يحتاج طلبك وموافقتك الصريحة من المساعد.
      </Notice>
      {disconnect && (
        <Confirm
          title="إيقاف ربط Moodle؟"
          description="سيُحذف التصريح المشفّر وتُخفى المعلومات المتزامنة ومواعيدها وإشعاراتها. تبقى مهامك وأحداثك الشخصية. إعادة الربط تحتاج تصريحًا من المسؤول."
          busy={unlink.isPending}
          onClose={() => setDisconnect(false)}
          onConfirm={() => unlink.mutate()}
        />
      )}
    </>
  );
}
