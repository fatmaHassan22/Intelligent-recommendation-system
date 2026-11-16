import { PushSettings } from "../integrations/PushSettings";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Bell, CheckCheck, Settings2, X, ArrowLeft, Check } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type { NotificationPage, NotificationPreferences } from "./api";
import {
  Badge,
  Button,
  Empty,
  ErrorState,
  Input,
  Modal,
  Notice,
  PageHeader,
  Skeleton,
  number,
  useToast,
} from "../../shared/ui";
import {
  prefix,
  useProductivityQuery,
  useProductivityRefresh,
  usePreferences,
  useTimezone,
} from "./hooks";
import { browserTimezone, timestampLabel } from "./time";
const typeLabels: Record<string, string> = {
  TASK_UPCOMING: "موعد مهمة قريب",
  TASK_OVERDUE: "مهمة متأخرة",
  EVENT_REMINDER: "حدث شخصي",
  POMODORO_COMPLETED: "بومودورو",
  GENERAL_REMINDER: "تذكير إنتاجية",
  ACHIEVEMENT: "شارة جديدة",
  STREAK_MILESTONE: "استمرارية",
  MOODLE_NEW_ITEM: "محتوى Moodle جديد",
  MOODLE_ANNOUNCEMENT: "إعلان Moodle",
  MOODLE_DEADLINE: "موعد Moodle",
};
function PreferencesEditor({
  preferences,
  onClose,
}: {
  preferences: NotificationPreferences;
  onClose: () => void;
}) {
  const { configured, ...initial } = preferences,
    [draft, setDraft] = useState({
      ...initial,
      timezone: configured === false ? browserTimezone() : initial.timezone,
    }),
    refresh = useProductivityRefresh(),
    toast = useToast();
  const save = useMutation({
    mutationFn: () => api.mutate(prefix + "/notifications/preferences", "PATCH", draft),
    onSuccess: async () => {
      await refresh();
      toast("حُفظت تفضيلات الإشعارات والتوقيت.");
      onClose();
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  return (
    <Modal
      title="تفضيلات الإشعارات"
      onClose={() => {
        if (!save.isPending) onClose();
      }}
    >
      <form
        className="productivity-form"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {(
          [
            ["task_upcoming", "تذكير باقتراب مواعيد المهام"],
            ["task_overdue", "تنبيه المهام المتأخرة"],
            ["event_reminders", "تذكير الأحداث الشخصية"],
            ["pomodoro_completion", "إشعار نهاية جلسة بومودورو"],
            ["general_reminders", "تذكير يومي عندما توجد مهام ولم تُكمل جلسة تركيز"],
          ] as const
        ).map(([key, label]) => (
          <label className="check-field" key={key}>
            <input
              type="checkbox"
              checked={draft[key]}
              onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
        <div className="form-two">
          <Input
            label="تذكير المهمة قبل الموعد (دقائق)"
            type="number"
            min={1}
            max={10080}
            required
            value={draft.task_reminder_minutes}
            onChange={(e) =>
              setDraft({ ...draft, task_reminder_minutes: Number(e.target.value) })
            }
          />
          <Input
            label="تذكير الحدث قبل البداية (دقائق)"
            type="number"
            min={1}
            max={10080}
            required
            value={draft.event_reminder_minutes}
            onChange={(e) =>
              setDraft({ ...draft, event_reminder_minutes: Number(e.target.value) })
            }
          />
        </div>
        <Input
          label="منطقتك الزمنية"
          value={draft.timezone}
          required
          onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
          hint="اسم المنطقة مثل Asia/Hebron. يستخدم لعرض التقويم وإحصاءات اليوم والتذكير العام."
        />
        <Notice>
          هذه تفضيلات الإشعارات الداخلية. تفعيل دفع الهاتف وإدارة أجهزتك متاحان في القسم
          المخصص أعلاه. تعطيل نوع يمنع إنشاء تذكيراته الجديدة ولا يحذف سجل الإشعارات
          السابقة.
        </Notice>
        <div className="dialog-actions">
          <Button
            variant="secondary"
            type="button"
            disabled={save.isPending}
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button type="submit" busy={save.isPending}>
            حفظ التفضيلات
          </Button>
        </div>
      </form>
    </Modal>
  );
}
export function NotificationsPage() {
  const [state, setState] = useState("ALL"),
    [page, setPage] = useState(1),
    [settingsOpen, setSettingsOpen] = useState(false),
    zone = useTimezone(),
    preferences = usePreferences(),
    refresh = useProductivityRefresh(),
    toast = useToast();
  const q = useProductivityQuery<NotificationPage>(
    "notifications",
    "/notifications?" + new URLSearchParams({ state, page: String(page), limit: "15" }),
  );
  const change = useMutation({
    mutationFn: ({
      id,
      read,
      dismiss,
    }: {
      id: string;
      read?: boolean;
      dismiss?: boolean;
    }) =>
      api.mutate(
        prefix + "/notifications/" + id,
        dismiss ? "DELETE" : "PATCH",
        dismiss ? undefined : { read },
      ),
    onSuccess: () => refresh(),
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const all = useMutation({
    mutationFn: () => api.mutate(prefix + "/notifications/read-all", "POST"),
    onSuccess: async () => {
      await refresh();
      toast("أصبحت جميع الإشعارات مقروءة.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  return (
    <>
      <PushSettings />
      <PageHeader
        eyebrow="تذكيرات تساعدك على المتابعة"
        title="الإشعارات"
        description="مواعيد المهام والأحداث ونهاية جلسات التركيز، في مركز واحد داخل حسابك."
        action={
          <div className="inline-actions">
            <Button
              variant="secondary"
              disabled={!preferences.data}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 size={16} />
              التفضيلات
            </Button>
            <Button
              variant="secondary"
              busy={all.isPending}
              disabled={!q.data?.unread_count}
              onClick={() => all.mutate()}
            >
              <CheckCheck size={17} />
              قراءة الكل
            </Button>
          </div>
        }
      />
      <div className="section-heading">
        <div className="productivity-tabs">
          {[
            ["ALL", "كل الإشعارات"],
            ["UNREAD", "غير المقروءة"],
            ["READ", "المقروءة"],
          ].map(([key, label]) => (
            <button
              className={state === key ? "active" : ""}
              aria-pressed={state === key}
              key={key}
              onClick={() => {
                setState(key);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <Badge tone="teal">{q.data ? number(q.data.unread_count) : "…"} غير مقروء</Badge>
      </div>
      <section className="surface notification-list">
        {q.error ? (
          <ErrorState error={q.error} retry={() => void q.refetch()} />
        ) : q.isPending ? (
          <Skeleton />
        ) : q.data.data.length ? (
          q.data.data.map((n) => (
            <article
              key={n.id}
              className={`notification-row ${!n.read_at ? "unread" : ""}`}
            >
              <span className="notification-symbol">
                <Bell size={21} />
              </span>
              <div className="notification-copy">
                <div className="task-chips">
                  <Badge tone={!n.read_at ? "teal" : "neutral"}>
                    {typeLabels[n.type] ?? "تذكير"}
                  </Badge>
                  {!n.read_at && <span className="unread-dot" aria-label="غير مقروء" />}
                </div>
                <h3>{n.title}</h3>
                <p>{n.message}</p>
                <small>{timestampLabel(n.created_at, zone)}</small>
                {n.href && (
                  <Link
                    to={n.href}
                    onClick={() => {
                      if (!n.read_at) change.mutate({ id: n.id, read: true });
                    }}
                  >
                    عرض العنصر المرتبط
                    <ArrowLeft size={15} />
                  </Link>
                )}
              </div>
              <div className="notification-actions">
                <button
                  className="icon-btn"
                  aria-label={n.read_at ? "وضع الإشعار كغير مقروء" : "قراءة الإشعار"}
                  disabled={change.isPending}
                  onClick={() => change.mutate({ id: n.id, read: !n.read_at })}
                >
                  <Check size={18} />
                </button>
                <button
                  className="icon-btn"
                  aria-label="إخفاء الإشعار"
                  disabled={change.isPending}
                  onClick={() => change.mutate({ id: n.id, dismiss: true })}
                >
                  <X size={18} />
                </button>
              </div>
            </article>
          ))
        ) : (
          <Empty
            title="لا إشعارات في هذا العرض"
            description="ستظهر هنا التذكيرات التي ينشئها الخادم عند اقتراب المواعيد أو انتهاء جلسة."
          />
        )}
        <div className="pagination">
          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            السابق
          </Button>
          <span>صفحة {number(page)}</span>
          <Button
            variant="secondary"
            disabled={!q.data || page * 15 >= q.data.pagination.total}
            onClick={() => setPage(page + 1)}
          >
            التالي
          </Button>
        </div>
      </section>
      <Notice>
        التذكيرات تُنشأ من الخادم أثناء تشغيله، حتى عند إغلاق المتصفح. تظهر عند فتح
        التطبيق؛ لا تُرسل إلى البريد أو الهاتف.
      </Notice>
      {settingsOpen && preferences.data && (
        <PreferencesEditor
          preferences={preferences.data.data}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
