import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Layers3, Plus, Sparkles } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type { Result } from "../../shared/api/types";
import type { Category, Draft, Recommendation, RecommendationsResponse } from "./api";
import {
  Badge,
  Button,
  Empty,
  ErrorState,
  Input,
  Notice,
  PageHeader,
  Select,
  Skeleton,
  Stat,
  modeLabel,
  number,
  roleLabel,
  useToast,
  buttonClass,
} from "../../shared/ui";
import { prefix, useDrafts, useRefreshPlanning } from "./hooks";
import { categoryLabels, offeringLabels } from "./labels";
import { StudyOptions, Evaluation, AddWarning } from "./components";

export function RecommendationCard({
  course,
  onAdd,
  busy,
  disabled,
  suggested = false,
}: {
  course: Recommendation;
  onAdd: () => void;
  busy: boolean;
  disabled: boolean;
  suggested?: boolean;
}) {
  return (
    <article className="course-card recommendation-card">
      <div className="course-card-top">
        <Badge
          tone={
            course.category === "SUITABLE"
              ? "teal"
              : course.category === "BLOCKED"
                ? "neutral"
                : "amber"
          }
        >
          {categoryLabels[course.category]}
        </Badge>
        {course.rank !== null && (
          <span className="rank-pill">#{number(course.rank)}</span>
        )}
      </div>
      <bdi className="course-code">{course.course_code}</bdi>
      <h3>{course.name_ar}</h3>
      <div className="course-meta">
        <span>{number(course.credit_hours)} ساعة</span>
        <span>
          {roleLabel(course.requirement_type)}
          {!course.classification_verified && course.requirement_type !== "UNVERIFIED"
            ? " (غير متحقق)"
            : ""}
        </span>
      </div>
      <Badge tone={course.offering_status === "CONFIRMED_OFFERED" ? "teal" : "amber"}>
        {offeringLabels[course.offering_status]}
      </Badge>
      {suggested && (
        <p className="suggestion-note">
          <Sparkles size={14} /> ضمن المجموعة المقترحة وفق نمط الدراسة
        </p>
      )}
      <p className="recommendation-reason">
        {course.reasons.find((r) =>
          [
            "COMPLETED",
            "SELECTED",
            "PREREQUISITES_UNVERIFIED",
            "PREREQUISITES_MISSING",
            "HOURS_UNKNOWN",
            "CREDIT_LIMIT",
            "METADATA_UNVERIFIED",
          ].includes(r.code),
        )?.text_ar ?? course.reasons[0]?.text_ar}
      </p>
      <Evaluation course={course} />
      <footer>
        <Button
          variant="secondary"
          busy={busy}
          disabled={disabled || course.already_completed || course.already_selected}
          onClick={onAdd}
          aria-label={`إضافة ${course.course_code} إلى المسودة`}
        >
          <Plus size={16} />
          {course.already_completed
            ? "منجز"
            : course.already_selected
              ? "في المسودة"
              : course.category === "SUITABLE"
                ? "إضافة للمسودة"
                : "إضافة للمراجعة"}
        </Button>
      </footer>
    </article>
  );
}

export function RecommendationsPage() {
  const drafts = useDrafts(),
    refresh = useRefreshPlanning(),
    toast = useToast();
  const [draftId, setDraftId] = useState(""),
    [mode, setMode] = useState(""),
    [category, setCategory] = useState(""),
    [requirement, setRequirement] = useState(""),
    [completed, setCompleted] = useState(false);
  const [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [page, setPage] = useState(1),
    [warning, setWarning] = useState<Recommendation | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = new URLSearchParams({
    page: String(page),
    limit: "9",
    include_completed: String(completed),
    ...(draftId ? { draft_id: draftId } : {}),
    ...(mode ? { study_mode: mode } : {}),
    ...(category ? { category } : {}),
    ...(requirement ? { requirement_type: requirement } : {}),
    ...(debounced ? { search: debounced } : {}),
  });
  const result = useQuery({
    queryKey: [
      "student",
      "recommendations",
      draftId,
      mode,
      category,
      requirement,
      completed,
      debounced,
      page,
    ],
    queryFn: () => api.get<RecommendationsResponse>(`${prefix}/recommendations?${query}`),
  });
  const draft = drafts.data?.find((p) => p.id === draftId);
  const add = useMutation({
    mutationFn: (c: Recommendation) =>
      api.mutate<Result<Draft>>(`${prefix}/semester-plans/${draftId}/courses`, "POST", {
        course_code: c.course_code,
        expected_revision: draft!.revision,
      }),
    onSuccess: async (r) => {
      setWarning(null);
      await refresh(r.data);
      toast("حُفظ المساق في المسودة.");
    },
    onError: async (e) => {
      toast(errorMessage(e), "error");
      await refresh();
    },
  });
  const select = (setter: (s: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  return (
    <>
      <PageHeader
        eyebrow="اختيارات تفسّر نفسها"
        title="توصية المواد"
        description="توصيات حتمية من بيانات خطتك وإنجازك. أهلية المساق الأكاديمية وحالة طرحه تظهران بشكل منفصل."
        action={
          <Link className={buttonClass("secondary")} to="/app/planner">
            مسوداتي
            <ArrowLeft size={16} />
          </Link>
        }
      />
      <Notice>
        التوصية ليست قرار تسجيل أو تخرج رسميًا. اختيارات المسودة لا تستوفي متطلبات بعضها؛
        يعتمد التقييم على إنجازك المسجل فقط.
      </Notice>
      {drafts.error && (
        <ErrorState error={drafts.error} retry={() => void drafts.refetch()} />
      )}
      <div className="surface planning-filters">
        <Select
          label="المسودة المراد الإضافة إليها"
          value={draftId}
          disabled={drafts.isPending || add.isPending}
          onChange={(e) => {
            setDraftId(e.target.value);
            setMode("");
            setPage(1);
          }}
        >
          <option value="">تقييم خطتي الحالية، دون مسودة</option>
          {drafts.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.major_code} · الخطة {p.plan_number}
            </option>
          ))}
        </Select>
        <Select
          label="نمط التوصيات"
          value={mode}
          onChange={(e) => select(setMode)(e.target.value)}
        >
          <option value="">حسب الملف أو المسودة</option>
          <StudyOptions />
        </Select>
        <Input
          label="البحث باسم المساق أو رمزه"
          maxLength={100}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="حالة التقييم"
          value={category}
          onChange={(e) => select(setCategory)(e.target.value)}
        >
          <option value="">جميع الحالات</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="تصنيف المتطلب"
          value={requirement}
          onChange={(e) => select(setRequirement)(e.target.value)}
        >
          <option value="">كل التصنيفات</option>
          <option value="REQUIRED">إجباري</option>
          <option value="ELECTIVE">اختياري</option>
          <option value="UNVERIFIED">غير متحقق</option>
        </Select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => {
              setCompleted(e.target.checked);
              setPage(1);
            }}
          />
          عرض المساقات المنجزة أيضًا
        </label>
      </div>
      {!draftId && (
        <Notice>
          لإضافة المساقات، اختر مسودة محفوظة أو{" "}
          <Link to="/app/planner">أنشئ مسودة جديدة</Link>.
        </Notice>
      )}
      {mode && (
        <p className="helper">
          اختيار النمط هنا للمقارنة فقط. لحفظ نمط المسودة، عدّليه من المخطط الدراسي.
        </p>
      )}
      {result.error ? (
        <ErrorState error={result.error} retry={() => void result.refetch()} />
      ) : result.isPending ? (
        <Skeleton />
      ) : (
        <>
          {!result.data.is_current_curriculum_plan && (
            <Notice>
              هذه مسودة من خطة سابقة. ستبقى مساقاتها وإنجازاتها مرتبطة بتلك الخطة.
            </Notice>
          )}
          <div className="stats-grid planning-stats">
            {(["SUITABLE", "BLOCKED", "UNVERIFIED", "NOT_OFFERED"] as Category[]).map(
              (k) => (
                <Stat
                  key={k}
                  label={categoryLabels[k]}
                  value={number(result.data.counts[k])}
                  hint="في دليل الخطة الكامل قبل الفلاتر"
                  icon={<Layers3 />}
                />
              ),
            )}
          </div>
          <div className="recommendation-summary surface">
            <strong>{modeLabel(result.data.study_mode)}</strong>
            <span>
              هدف تفضيلي: حتى {number(result.data.preference_target_credit_hours)} ساعة و
              {number(result.data.preference_target_course_count)} مساقات
            </span>
            <span>
              السعة المؤكدة المتبقية:{" "}
              {number(result.data.credit_summary.remaining_credit_capacity)}
            </span>
            <p>
              الهدف تفضيل لتنظيم الدراسة، وليس حدًا جامعيًا. المجموعة المقترحة تراعي
              المساقات المختارة والساعات المعروفة.
            </p>
          </div>
          <div className="results-heading">
            <span>{number(result.data.pagination.total)} مساق مطابق</span>
            <small>لا يُفترض طرح المساق اعتمادًا على فصله المعتاد</small>
          </div>
          {result.data.data.length ? (
            <div className="course-grid">
              {result.data.data.map((c) => (
                <RecommendationCard
                  key={c.course_code}
                  course={c}
                  disabled={!draft || add.isPending}
                  busy={add.isPending && add.variables?.course_code === c.course_code}
                  suggested={result.data.suggested_course_codes.includes(c.course_code)}
                  onAdd={() =>
                    c.category === "SUITABLE" ? add.mutate(c) : setWarning(c)
                  }
                />
              ))}
            </div>
          ) : (
            <Empty
              title="لا توجد نتائج مطابقة"
              description="عدّل البحث أو الفلاتر. نقص البيانات لا يُعد إثباتًا لعدم طرح المساقات."
            />
          )}
          <div className="pagination">
            <Button
              variant="secondary"
              disabled={page === 1 || result.isFetching}
              onClick={() => setPage(page - 1)}
            >
              السابق
            </Button>
            <span>
              صفحة {number(page)} من{" "}
              {number(Math.max(1, Math.ceil(result.data.pagination.total / 9)))}
            </span>
            <Button
              variant="secondary"
              disabled={page * 9 >= result.data.pagination.total || result.isFetching}
              onClick={() => setPage(page + 1)}
            >
              التالي
            </Button>
          </div>
        </>
      )}
      {warning && (
        <AddWarning
          course={warning}
          busy={add.isPending}
          onConfirm={() => add.mutate(warning)}
          onClose={() => setWarning(null)}
        />
      )}
    </>
  );
}
