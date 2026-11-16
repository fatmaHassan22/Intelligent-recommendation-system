import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Plus, Timer } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type { Result } from "../../shared/api/types";
import type { Task, TaskPage, TaskStatus } from "./api";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  number,
  useToast,
} from "../../shared/ui";
import {
  prefix,
  useProductivityQuery,
  useProductivityRefresh,
  useTimezone,
} from "./hooks";
import { priorityLabel, statusLabel } from "./labels";
import { TaskEditor } from "./TaskEditor";
import { TaskRow } from "./TaskRow";

export function TasksPage() {
  const zone = useTimezone(),
    refresh = useProductivityRefresh(),
    toast = useToast(),
    navigate = useNavigate(),
    { taskId } = useParams();
  const [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [view, setView] = useState("ALL"),
    [status, setStatus] = useState(""),
    [priority, setPriority] = useState(""),
    [sort, setSort] = useState("DEADLINE"),
    [page, setPage] = useState(1),
    [editor, setEditor] = useState<Task | "NEW" | null>(null),
    [deleting, setDeleting] = useState<Task | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const params = new URLSearchParams({
    timezone: zone,
    page: String(page),
    limit: "12",
    view,
    sort,
    ...(debounced ? { search: debounced } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  });
  const list = useProductivityQuery<TaskPage>("tasks", "/tasks?" + params),
    detail = useProductivityQuery<Result<Task>>("task", "/tasks/" + taskId, !!taskId);
  const change = useMutation({
    mutationFn: ({ task, status }: { task: Task; status: TaskStatus }) =>
      api.mutate(prefix + "/tasks/" + task.id, "PATCH", {
        status,
        expected_revision: task.revision,
      }),
    onSuccess: async () => {
      await refresh();
      toast("حُدثت حالة المهمة في القائمة والتقويم.");
    },
    onError: (e) => {
      toast(errorMessage(e), "error");
      void refresh();
    },
  });
  const remove = useMutation({
    mutationFn: () =>
      api.mutate(prefix + "/tasks/" + deleting!.id, "DELETE", {
        expected_revision: deleting!.revision,
      }),
    onSuccess: async () => {
      if (taskId === deleting?.id) navigate("/app/tasks");
      setDeleting(null);
      await refresh();
      toast("حُذفت المهمة من القائمة والتقويم.");
    },
    onError: (e) => {
      toast(errorMessage(e), "error");
      void refresh();
    },
  });
  const filter = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };
  return (
    <>
      <PageHeader
        eyebrow="خطوة صغيرة، إنجاز واضح"
        title="المهام"
        description="نظّم مهامك ومواعيدك، واربطها بمساقات خطتك عند الحاجة."
        action={
          <Button onClick={() => setEditor("NEW")}>
            <Plus size={17} />
            مهمة جديدة
          </Button>
        }
      />
      <div className="productivity-tabs" aria-label="عرض المهام">
        {[
          ["ALL", "كل المهام"],
          ["TODAY", "اليوم"],
          ["UPCOMING", "القادمة"],
          ["OVERDUE", "المتأخرة"],
          ["COMPLETED", "المكتملة"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={view === key ? "active" : ""}
            aria-pressed={view === key}
            onClick={() => filter(setView, key)}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="surface productivity-filters">
        <Input
          label="البحث في المهام"
          placeholder="عنوان، وصف أو رمز مساق"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="تصفية الحالة"
          value={status}
          onChange={(e) => filter(setStatus, e.target.value)}
        >
          <option value="">كل الحالات</option>
          {Object.entries(statusLabel).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="تصفية الأولوية"
          value={priority}
          onChange={(e) => filter(setPriority, e.target.value)}
        >
          <option value="">كل الأولويات</option>
          {Object.entries(priorityLabel).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="ترتيب المهام"
          value={sort}
          onChange={(e) => filter(setSort, e.target.value)}
        >
          <option value="DEADLINE">الموعد الأقرب</option>
          <option value="PRIORITY">الأولوية الأعلى</option>
          <option value="CREATED">الأحدث إنشاءً</option>
        </Select>
      </section>
      <section className="surface task-list-surface">
        <div className="section-heading">
          <h2>قائمتك</h2>
          <Badge>{list.data ? number(list.data.pagination.total) : "…"} مهمة</Badge>
        </div>
        {list.error ? (
          <ErrorState error={list.error} retry={() => void list.refetch()} />
        ) : list.isPending ? (
          <Skeleton />
        ) : list.data.data.length ? (
          list.data.data.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onEdit={() => setEditor(task)}
              onDelete={() => setDeleting(task)}
              onStatus={
                change.isPending ? undefined : (status) => change.mutate({ task, status })
              }
            />
          ))
        ) : (
          <Empty
            title="مساحة لإنجاز جديد"
            description="لا توجد مهام مطابقة لهذا العرض. أضف مهمة أو عدّل الفلاتر."
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
            disabled={!list.data || page * 12 >= list.data.pagination.total}
            onClick={() => setPage(page + 1)}
          >
            التالي
          </Button>
        </div>
      </section>
      {taskId && !editor && (
        <Modal
          title={detail.data?.data.title ?? "تفاصيل المهمة"}
          onClose={() => navigate("/app/tasks")}
        >
          {detail.error ? (
            <ErrorState error={detail.error} />
          ) : detail.isPending ? (
            <Skeleton />
          ) : (
            <>
              <TaskRow task={detail.data.data} />
              <p className="event-description">
                {detail.data.data.description || "لم يُضف وصف لهذه المهمة."}
              </p>
              <p className="muted">{detail.data.data.course_name}</p>
              <div className="dialog-actions">
                <Link className="btn btn-secondary" to={`/app/pomodoro?task=${taskId}`}>
                  <Timer size={17} />
                  تركيز على المهمة
                </Link>
                <Button variant="secondary" onClick={() => setEditor(detail.data!.data)}>
                  تعديل المهمة
                </Button>
                <Button variant="danger" onClick={() => setDeleting(detail.data!.data)}>
                  حذف المهمة
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}
      {editor && (
        <TaskEditor
          task={editor === "NEW" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}{" "}
      {deleting && (
        <Confirm
          title="حذف المهمة؟"
          description={`ستُحذف «${deleting.title}» من مهامك وتقويمك. سجل جلسات التركيز المكتملة يبقى محفوظًا.`}
          busy={remove.isPending}
          onConfirm={() => remove.mutate()}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
