import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, Sparkles, Trash2 } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type { Result, StudyMode } from "../../shared/api/types";
import type { Draft, DraftCourse, Recommendation, RecommendationsResponse } from "./api";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Input,
  Notice,
  PageHeader,
  Select,
  Skeleton,
  number,
  useToast,
} from "../../shared/ui";
import { prefix, useTerms, useRefreshPlanning } from "./hooks";
import { categoryLabels, offeringLabels } from "./labels";
import { StudyOptions, TermOptions, Credits, Evaluation, AddWarning } from "./components";
import { RecommendationCard } from "./RecommendationsPage";

export function DraftPage() {
  const { planId = "" } = useParams(),
    terms = useTerms(),
    refresh = useRefreshPlanning(),
    toast = useToast();
  const draft = useQuery({
    queryKey: ["student", "draft", planId],
    queryFn: () =>
      api.get<Result<Draft>>(`${prefix}/semester-plans/${planId}`).then((r) => r.data),
  });
  const [name, setName] = useState(""),
    [term, setTerm] = useState(""),
    [mode, setMode] = useState<StudyMode>("BALANCED"),
    [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [page, setPage] = useState(1),
    [warning, setWarning] = useState<Recommendation | null>(null),
    [removing, setRemoving] = useState<DraftCourse | null>(null);
  useEffect(() => {
    if (draft.data) {
      setName(draft.data.name);
      setTerm(draft.data.academic_term_id ?? "");
      setMode(draft.data.study_mode);
    }
  }, [draft.data]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const recommendations = useQuery({
    queryKey: ["student", "recommendations", "draft", planId, debounced, page],
    queryFn: () =>
      api.get<RecommendationsResponse>(
        `${prefix}/recommendations?${new URLSearchParams({ draft_id: planId, search: debounced, page: String(page), limit: "6" })}`,
      ),
    enabled: !!draft.data,
  });
  const success = async (r: Result<Draft>, message: string) => {
    await refresh(r.data);
    setWarning(null);
    setRemoving(null);
    toast(message);
  };
  const failure = async (e: unknown) => {
    toast(errorMessage(e), "error");
    await draft.refetch();
    await refresh();
  };
  const save = useMutation({
    mutationFn: () =>
      api.mutate<Result<Draft>>(`${prefix}/semester-plans/${planId}`, "PATCH", {
        name: name.trim(),
        academic_term_id: term || null,
        study_mode: mode,
        expected_revision: draft.data!.revision,
      }),
    onSuccess: (r) => success(r, "حُفظت تعديلات المسودة."),
    onError: failure,
  });
  const add = useMutation({
    mutationFn: (c: Recommendation) =>
      api.mutate<Result<Draft>>(`${prefix}/semester-plans/${planId}/courses`, "POST", {
        course_code: c.course_code,
        expected_revision: draft.data!.revision,
      }),
    onSuccess: (r) => success(r, "حُفظ المساق في المسودة."),
    onError: failure,
  });
  const remove = useMutation({
    mutationFn: (c: DraftCourse) =>
      api.mutate<Result<Draft>>(
        `${prefix}/semester-plans/${planId}/courses/${c.course_code}`,
        "DELETE",
        { expected_revision: draft.data!.revision },
      ),
    onSuccess: (r) => success(r, "أُزيل المساق من المسودة."),
    onError: failure,
  });
  if (draft.error)
    return <ErrorState error={draft.error} retry={() => void draft.refetch()} />;
  if (draft.isPending) return <Skeleton />;
  const p = draft.data,
    v = p.validation!,
    busy = save.isPending || add.isPending || remove.isPending;
  const dirty =
    name !== p.name || term !== (p.academic_term_id ?? "") || mode !== p.study_mode;
  return (
    <>
      <Link className="back-link" to="/app/planner">
        العودة إلى مسوداتي
        <ArrowLeft size={16} />
      </Link>
      <PageHeader
        title={p.name}
        eyebrow={`${p.major_name_ar} · الخطة ${p.plan_number}`}
        description="المساقات والتعديلات تُحفظ في الخادم. لا تُنقل المسودة تلقائيًا عند تغيير خطتك."
        action={<Badge tone="teal">مسودة محفوظة</Badge>}
      />
      {!p.is_current_curriculum_plan && (
        <Notice>
          هذه مسودة من خطة سابقة. المراجعة تستخدم متطلبات تلك الخطة وإنجازاتها، دون نقل
          المساقات إلى خطتك الحالية.
        </Notice>
      )}
      <form
        className="surface draft-settings"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Input
          label="اسم المسودة"
          value={name}
          maxLength={120}
          required
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
        />
        <Select
          label="الفصل الأكاديمي"
          disabled={terms.isPending || !!terms.error || busy}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        >
          <TermOptions terms={terms.data ?? []} />
        </Select>
        <Select
          label="نمط الدراسة"
          value={mode}
          disabled={busy}
          onChange={(e) => setMode(e.target.value as StudyMode)}
        >
          <StudyOptions />
        </Select>
        <Button type="submit" busy={save.isPending} disabled={busy || !dirty}>
          حفظ التغييرات
          <Save size={17} />
        </Button>
      </form>
      {terms.error && (
        <ErrorState error={terms.error} retry={() => void terms.refetch()} />
      )}
      {!terms.isPending && !terms.error && !terms.data?.length && (
        <p className="helper">
          لا توجد فصول فعلية مسجلة للاختيار منها. المسودة متاحة، لكن الطرح الفعلي يظل غير
          مؤكد.
        </p>
      )}
      {dirty && (
        <Notice>
          لديك تعديلات غير محفوظة في بيانات المسودة. احفظها قبل إضافة أو إزالة المساقات.
        </Notice>
      )}
      <Credits validation={v} />
      <section
        className={`surface validation-panel ${v.fully_validated ? "checked" : ""}`}
      >
        <div className="section-heading">
          <h2>مراجعة المسودة</h2>
          <Badge tone={v.fully_validated ? "teal" : "amber"}>
            {v.fully_validated ? "الشروط المسجلة مستوفاة" : "تحتاج مراجعة"}
          </Badge>
        </div>
        <p>
          {v.academically_valid
            ? "الأهلية الأكاديمية والساعات متوافقة ضمن البيانات المتاحة."
            : "لا يمكن اعتبار هذه المسودة مستوفية للشروط الأكاديمية والساعات حاليًا."}
        </p>
        {v.warnings.length > 0 && (
          <ul>
            {v.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
        <p className="helper">
          حتى استيفاء الشروط المسجلة لا يمثل موافقة جامعية أو قرار تسجيل أو تخرج رسميًا.
        </p>
      </section>
      <section className="surface">
        <div className="section-heading">
          <h2>المساقات المختارة</h2>
          <Badge>{number(v.courses.length)} مساق</Badge>
        </div>
        {v.courses.length ? (
          <div className="selected-courses">
            {v.courses.map((c) => (
              <article className="selected-course" key={c.course_code}>
                <div className="selected-course-heading">
                  <div>
                    <bdi className="course-code">{c.course_code}</bdi>
                    <h3>{c.name_ar}</h3>
                    <div className="course-meta">
                      <span>{number(c.credit_hours)} ساعة</span>
                      <Badge tone={c.category === "SUITABLE" ? "teal" : "amber"}>
                        {categoryLabels[c.category]}
                      </Badge>
                      <Badge>{offeringLabels[c.offering_status]}</Badge>
                    </div>
                  </div>
                  <button
                    className="icon-btn remove-btn"
                    aria-label={`إزالة ${c.course_code} من المسودة`}
                    disabled={busy || dirty}
                    onClick={() => setRemoving(c)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <Evaluation course={c} />
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="المسودة تنتظر اختياراتك"
            description="أضف مساقات من الخيارات أدناه. يمكنك حفظ اختيارات غير متحققة للمراجعة مع إبقاء تحذيراتها."
          />
        )}
      </section>
      <section className="surface">
        <div className="section-heading">
          <div>
            <span className="section-kicker">اختيارات من خطة هذه المسودة</span>
            <h2>إضافة مساقات</h2>
          </div>
          <Sparkles size={22} />
        </div>
        <Input
          label="البحث في مساقات المسودة"
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
        />
        {recommendations.error ? (
          <ErrorState
            error={recommendations.error}
            retry={() => void recommendations.refetch()}
          />
        ) : recommendations.isPending ? (
          <Skeleton />
        ) : recommendations.data.data.length ? (
          <>
            <div className="course-grid draft-course-grid">
              {recommendations.data.data.map((c) => (
                <RecommendationCard
                  key={c.course_code}
                  course={c}
                  disabled={busy || dirty}
                  busy={add.isPending && add.variables?.course_code === c.course_code}
                  suggested={recommendations.data.suggested_course_codes.includes(
                    c.course_code,
                  )}
                  onAdd={() =>
                    c.category === "SUITABLE" ? add.mutate(c) : setWarning(c)
                  }
                />
              ))}
            </div>
            <div className="pagination">
              <Button
                variant="secondary"
                disabled={page === 1 || recommendations.isFetching}
                onClick={() => setPage(page - 1)}
              >
                السابق
              </Button>
              <span>
                صفحة {number(page)} من{" "}
                {number(
                  Math.max(1, Math.ceil(recommendations.data.pagination.total / 6)),
                )}
              </span>
              <Button
                variant="secondary"
                disabled={
                  page * 6 >= recommendations.data.pagination.total ||
                  recommendations.isFetching
                }
                onClick={() => setPage(page + 1)}
              >
                التالي
              </Button>
            </div>
          </>
        ) : (
          <Empty title="لا توجد نتائج مطابقة" description="جرّب اسمًا أو رمزًا آخر." />
        )}
      </section>
      {warning && (
        <AddWarning
          course={warning}
          busy={add.isPending}
          onConfirm={() => add.mutate(warning)}
          onClose={() => setWarning(null)}
        />
      )}{" "}
      {removing && (
        <Confirm
          title="إزالة المساق من المسودة؟"
          description={`سيُزال ${removing.name_ar} من هذه المسودة فقط؛ لن يتغير سجل إنجازك أو الدليل الأكاديمي.`}
          busy={remove.isPending}
          onConfirm={() => remove.mutate(removing)}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  );
}
