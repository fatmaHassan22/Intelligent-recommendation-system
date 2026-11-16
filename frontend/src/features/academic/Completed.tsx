import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCheck, Trash2, Plus } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type { Course, CoursePage } from "../../shared/api/types";
import {
  useCompleted,
  useProfile,
  useRefreshAcademic,
} from "../../shared/hooks/academic";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Input,
  PageHeader,
  Skeleton,
  number,
  useToast,
} from "../../shared/ui";

export function Completed() {
  const courses = useCompleted(),
    profile = useProfile(),
    refresh = useRefreshAcademic(),
    toast = useToast();
  const [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [page, setPage] = useState(1),
    [confirm, setConfirm] = useState<Course | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const available = useQuery({
    queryKey: [
      "catalog",
      "completion-search",
      profile.data?.curriculum_plan_id,
      debounced,
      page,
    ],
    queryFn: () =>
      api.get<CoursePage>(
        `/plans/${profile.data!.curriculum_plan_id}/courses?${new URLSearchParams({ search: debounced, page: String(page), limit: "5" })}`,
      ),
    enabled: !!profile.data,
  });
  const add = useMutation({
    mutationFn: (code: string) =>
      api.mutate("/students/me/completed-courses", "POST", { course_code: code }),
    onSuccess: async () => {
      await refresh();
      toast("تم تسجيل المساق كمنجز.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const remove = useMutation({
    mutationFn: (code: string) =>
      api.mutate(`/students/me/completed-courses/${encodeURIComponent(code)}`, "DELETE"),
    onSuccess: async () => {
      await refresh();
      setConfirm(null);
      toast("تمت إزالة إعلان الإنجاز.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const done = new Set(courses.data?.map((c) => c.course_code));
  return (
    <>
      <PageHeader
        eyebrow="سجلك الشخصي"
        title="المواد المنجزة"
        description="سجّل المساقات التي أُعلن اجتيازها. هذا إقرار منك، وليس سجل علامات معتمدًا من الجامعة."
      />
      <div className="dashboard-columns completed-columns">
        <section className="surface">
          <div className="section-heading">
            <h2>مساقاتك المنجزة</h2>
            <Badge tone="teal">{number(courses.data?.length)} مساق</Badge>
          </div>
          {courses.error ? (
            <ErrorState error={courses.error} retry={() => void courses.refetch()} />
          ) : courses.isPending ? (
            <Skeleton />
          ) : courses.data.length ? (
            courses.data.map((c) => (
              <div className="completion-row" key={c.course_code}>
                <span className="course-mini-icon">
                  <CheckCheck size={20} />
                </span>
                <div>
                  <Link to={`/app/curriculum/${c.course_code}`}>{c.name_ar}</Link>
                  <small>
                    <bdi>{c.course_code}</bdi> · {number(c.credit_hours)} ساعة
                  </small>
                </div>
                <button
                  className="icon-btn remove-btn"
                  aria-label={`إزالة إنجاز ${c.course_code}`}
                  onClick={() => setConfirm(c)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <Empty
              title="لم تسجّل إنجازًا بعد"
              description="ابحث في المساقات المتاحة وأضف ما أُعلن اجتيازه بالفعل."
            />
          )}
        </section>
        <section className="surface">
          <div className="section-heading">
            <h2>إضافة مساق منجز</h2>
            <Plus size={20} />
          </div>
          <Input
            label="ابحث في خطتك"
            placeholder="اسم المساق أو رمزه"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {profile.error ? (
            <ErrorState error={profile.error} retry={() => void profile.refetch()} />
          ) : available.error ? (
            <ErrorState error={available.error} retry={() => void available.refetch()} />
          ) : available.isPending ? (
            <Skeleton />
          ) : available.data.data.length ? (
            <>
              {available.data.data.map((c) => (
                <div className="add-course-row" key={c.course_code}>
                  <div>
                    <strong>{c.source_name_ar ?? c.name_ar}</strong>
                    <small>
                      <bdi>{c.course_code}</bdi> · {number(c.credit_hours)} ساعة
                    </small>
                  </div>
                  <Button
                    variant="secondary"
                    disabled={
                      done.has(c.course_code) ||
                      add.isPending ||
                      courses.isPending ||
                      !!courses.error
                    }
                    busy={add.isPending && add.variables === c.course_code}
                    onClick={() => add.mutate(c.course_code)}
                  >
                    {done.has(c.course_code) ? "منجز" : "إضافة"}
                  </Button>
                </div>
              ))}
              <div className="pagination small-pagination">
                <Button
                  variant="ghost"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  السابق
                </Button>
                <small>صفحة {number(page)}</small>
                <Button
                  variant="ghost"
                  disabled={page * 5 >= available.data.pagination.total}
                  onClick={() => setPage(page + 1)}
                >
                  التالي
                </Button>
              </div>
            </>
          ) : (
            <Empty title="لا توجد نتائج" description="جرّب اسمًا أو رمزًا آخر." />
          )}
          <p className="helper">
            لا تُضاف المتطلبات السابقة تلقائيًا عند إعلان إنجاز مساق.
          </p>
        </section>
      </div>
      {confirm && (
        <Confirm
          title="إزالة إعلان الإنجاز؟"
          description={`سيُزال ${confirm.name_ar} من إنجازات خطتك الحالية فقط. لن يُحذف المساق من الخطة أو الدليل.`}
          busy={remove.isPending}
          onClose={() => setConfirm(null)}
          onConfirm={() => remove.mutate(confirm.course_code)}
        />
      )}
    </>
  );
}
