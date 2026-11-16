import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCheck, Plus, CalendarDays, Info } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type {
  CourseDetail,
  ElectiveGroup,
  PrerequisiteEvaluation,
  Result,
} from "../../shared/api/types";
import {
  useCompleted,
  useProfile,
  useRefreshAcademic,
} from "../../shared/hooks/academic";
import {
  Badge,
  Button,
  Empty,
  ErrorState,
  Notice,
  PageHeader,
  Skeleton,
  number,
  roleLabel,
  useToast,
} from "../../shared/ui";

export function GroupCard({ group }: { group: ElectiveGroup }) {
  const completed = group.known_credit_hours,
    target = group.required_credit_hours;
  return (
    <article className="elective-card">
      <div>
        <span className="section-kicker">مجموعة اختياري</span>
        <h3>{group.name_ar ?? "مجموعة الاختياري"}</h3>
      </div>
      <div className="elective-numbers">
        <strong>
          {number(completed)} <small>/ {number(target)}</small>
        </strong>
        <span>ساعة معروفة / مطلوبة من المجموعة</span>
      </div>
      {typeof target === "number" && target > 0 && typeof completed === "number" && (
        <progress
          value={Math.min(completed, target)}
          max={target}
          aria-label="الساعات المنجزة من مجموعة الاختياري"
        />
      )}
      <p>المطلوب هو هدف المجموعة، وليس اجتياز جميع الخيارات.</p>
    </article>
  );
}

export function CourseDetails() {
  const { courseCode = "" } = useParams(),
    profile = useProfile(),
    toast = useToast(),
    refresh = useRefreshAcademic(),
    completed = useCompleted();
  const course = useQuery({
    queryKey: ["catalog", "detail", profile.data?.curriculum_plan_id, courseCode],
    queryFn: () =>
      api
        .get<Result<CourseDetail>>(
          `/plans/${profile.data!.curriculum_plan_id}/courses/${encodeURIComponent(courseCode)}`,
        )
        .then((r) => r.data),
    enabled: !!profile.data,
  });
  const evaluation = useQuery({
    queryKey: ["student", "prerequisite", profile.data?.curriculum_plan_id, courseCode],
    queryFn: () =>
      api
        .get<Result<PrerequisiteEvaluation>>(
          `/students/me/courses/${encodeURIComponent(courseCode)}/prerequisites`,
        )
        .then((r) => r.data),
    enabled: !!profile.data,
  });
  const add = useMutation({
    mutationFn: () =>
      api.mutate("/students/me/completed-courses", "POST", { course_code: courseCode }),
    onSuccess: async () => {
      await refresh();
      toast("سُجل المساق كمنجز بإقرار المستخدم.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  if (profile.error || course.error)
    return (
      <ErrorState
        error={profile.error ?? course.error}
        retry={() => {
          void profile.refetch();
          void course.refetch();
        }}
      />
    );
  if (course.isPending) return <Skeleton />;
  const c = course.data,
    isCompleted = completed.data?.some((x) => x.course_code === courseCode),
    e = evaluation.data;
  return (
    <>
      <Link className="back-link" to="/app/curriculum">
        <ArrowRight size={16} /> العودة للخطة
      </Link>
      <PageHeader
        eyebrow={c.course_code}
        title={c.source_name_ar ?? c.name_ar}
        description="تفاصيل المساق في خطتك الحالية، لا في جميع الخطط."
        action={
          <Badge tone={c.requirement_type === "UNVERIFIED" ? "amber" : "teal"}>
            {roleLabel(c.requirement_type)}
          </Badge>
        }
      />
      <div className="detail-overview surface">
        <div>
          <small>الساعات</small>
          <strong>{number(c.credit_hours)}</strong>
        </div>
        <div>
          <small>المستوى</small>
          <strong>{number(c.level)}</strong>
        </div>
        <div>
          <small>الإنجاز</small>
          <strong>
            {completed.isPending
              ? "جارٍ التحقق"
              : isCompleted
                ? "منجز بإقرار المستخدم"
                : "غير منجز"}
          </strong>
        </div>
        <Button
          busy={add.isPending}
          disabled={isCompleted || completed.isPending || !!completed.error}
          onClick={() => add.mutate()}
        >
          {isCompleted ? <CheckCheck size={18} /> : <Plus size={18} />}{" "}
          {isCompleted ? "تم تسجيل الإنجاز" : "أعلن اجتياز هذا المساق"}
        </Button>
      </div>
      {completed.error && (
        <ErrorState error={completed.error} retry={() => void completed.refetch()} />
      )}
      <section className="surface">
        <div className="section-heading">
          <h2>المتطلبات السابقة</h2>
          <Badge tone={e?.is_unverified ? "amber" : e?.satisfied ? "teal" : "neutral"}>
            {!e
              ? "جارٍ التحقق"
              : e.is_unverified
                ? "المعلومات غير متحققة"
                : e.satisfied
                  ? "مستوفاة حسب إقرارك"
                  : "متطلبات غير مستوفاة"}
          </Badge>
        </div>
        <p className="helper">
          كل البنود التالية مطلوبة معًا (و). داخل كل بند يكفي اجتياز بديل واحد (أو)، وفق
          تقييم الخادم.
        </p>
        {evaluation.error ? (
          <ErrorState error={evaluation.error} retry={() => void evaluation.refetch()} />
        ) : evaluation.isPending ? (
          <Skeleton />
        ) : e?.is_unverified ? (
          <Notice>
            لا تتوفر معلومات متحققة كافية عن المتطلبات السابقة. لا يعني ذلك عدم وجود
            متطلب.
          </Notice>
        ) : e?.groups.length === 0 ? (
          <Empty
            title="لا يوجد متطلب سابق مسجل"
            description="وردت هذه الحالة صراحة في بيانات الخطة الحالية."
          />
        ) : (
          <div className="prerequisite-groups">
            {e?.groups.map((g, i) => (
              <div key={g.group_number}>
                <article
                  className={`prerequisite-group ${g.satisfied ? "satisfied" : ""}`}
                >
                  <header>
                    <strong>البند {number(i + 1)}</strong>
                    <Badge tone={g.satisfied ? "teal" : "amber"}>
                      {g.satisfied ? "مستوفى" : "غير مستوفى"}
                    </Badge>
                  </header>
                  <div className="prerequisite-alternatives">
                    {g.courses.map((code, index) => (
                      <div key={code}>
                        {index > 0 && <span className="operator">أو</span>}
                        <span className="prerequisite-code">
                          <bdi>{code}</bdi>
                          <small>
                            {g.completed_alternatives?.includes(code)
                              ? "أُعلن اجتيازه"
                              : "لم يُعلن اجتيازه"}
                          </small>
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
                {i < e.groups.length - 1 && (
                  <div className="and-connector">و · يجب استيفاء البند التالي أيضًا</div>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="helper">
          هذا عرض للمتطلبات ضمن البيانات المتاحة، وليس قرار أهلية للتسجيل.
        </p>
      </section>
      <div className="dashboard-columns">
        <section className="surface">
          <div className="section-heading">
            <h2>الفصول المعتادة</h2>
            <CalendarDays size={20} />
          </div>
          {c.typical_semesters.records.length ? (
            c.typical_semesters.records.map((s) => (
              <div className="semester-record" key={s.code}>
                <Badge tone="blue">{s.name_ar}</Badge>
                <small>
                  {s.verification_status === "LEGACY_DATA"
                    ? "بيانات قديمة تحتاج تحققًا"
                    : "بحسب المصدر المسجل"}
                </small>
              </div>
            ))
          ) : (
            <p className="muted">الفصل المعتاد لهذا المساق غير معروف.</p>
          )}
          <p className="helper">تكرار طرح المساق عادةً لا يؤكد طرحه في فصل بعينه.</p>
        </section>
        <section className="surface">
          <div className="section-heading">
            <h2>الطرح الفعلي</h2>
            <Info size={20} />
          </div>
          {c.live_offerings.records.length ? (
            c.live_offerings.records.map((o, i) => (
              <p key={i}>
                {o.academic_year} · {o.semester} · {o.is_offered ? "مطروح" : "غير مطروح"}
              </p>
            ))
          ) : (
            <p className="muted">لا توجد بيانات مؤكدة عن الطرح الفعلي.</p>
          )}
        </section>
      </div>
    </>
  );
}
