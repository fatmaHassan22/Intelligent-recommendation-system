import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { api } from "../../shared/api/client";
import type { Course, CoursePage, ElectiveGroup, List } from "../../shared/api/types";
import { useCompleted, useProfile } from "../../shared/hooks/academic";
import {
  Badge,
  Button,
  Empty,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  number,
  roleLabel,
} from "../../shared/ui";

function CourseCard({
  course,
  completed,
}: {
  course: Course;
  completed: boolean | null;
}) {
  return (
    <article className="course-card">
      <div className="course-card-top">
        <span className="course-symbol">
          <BookOpen size={19} />
        </span>
        <Badge
          tone={
            course.requirement_type === "UNVERIFIED"
              ? "amber"
              : course.requirement_type === "ELECTIVE"
                ? "teal"
                : "blue"
          }
        >
          {roleLabel(course.requirement_type)}
        </Badge>
      </div>
      <bdi className="course-code">{course.course_code}</bdi>
      <h3>{course.source_name_ar ?? course.name_ar}</h3>
      <div className="course-meta">
        <span>{number(course.credit_hours)} ساعة</span>
        <span>المستوى {number(course.level)}</span>
      </div>
      <footer>
        {completed === null ? (
          <span className="muted">جارٍ التحقق من الإنجاز</span>
        ) : completed ? (
          <span className="completed-label">
            <CheckCircle2 size={16} /> منجز بإقرار المستخدم
          </span>
        ) : (
          <span className="muted">لم يُعلن إنجازه</span>
        )}
        <Link
          to={`/app/curriculum/${course.course_code}`}
          aria-label={`تفاصيل ${course.name_ar}`}
        >
          التفاصيل
          <ArrowLeft size={15} />
        </Link>
      </footer>
    </article>
  );
}

export function Curriculum() {
  const profile = useProfile(),
    completed = useCompleted();
  const [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState(""),
    [level, setLevel] = useState(""),
    [requirement, setRequirement] = useState(""),
    [page, setPage] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const query = new URLSearchParams({
    page: String(page),
    limit: "12",
    ...(debounced ? { search: debounced } : {}),
    ...(level ? { level } : {}),
    ...(requirement ? { requirement_type: requirement } : {}),
  });
  const courses = useQuery({
    queryKey: [
      "catalog",
      "courses",
      profile.data?.curriculum_plan_id,
      page,
      debounced,
      level,
      requirement,
    ],
    queryFn: () =>
      api.get<CoursePage>(`/plans/${profile.data!.curriculum_plan_id}/courses?${query}`),
    enabled: !!profile.data,
  });
  const groups = useQuery({
    queryKey: ["catalog", "electives", profile.data?.curriculum_plan_id],
    queryFn: () =>
      api
        .get<List<ElectiveGroup>>(
          `/plans/${profile.data!.curriculum_plan_id}/elective-groups`,
        )
        .then((r) => r.data),
    enabled: !!profile.data,
  });
  const codes = new Set(completed.data?.map((c) => c.course_code));
  return (
    <>
      <PageHeader
        eyebrow="مساقات ومتطلبات"
        title="خطتي الدراسية"
        description="استكشف مساقات خطتك الحالية، وافهم ما تعرفه البيانات وما لم يُتحقق منه بعد."
      />
      <div className="filters surface">
        <Input
          label="البحث عن مساق"
          placeholder="اسم المساق أو رمزه…"
          maxLength={100}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          label="المستوى الأكاديمي"
          type="number"
          min={1}
          max={65535}
          placeholder="كل المستويات"
          value={level}
          onChange={(e) => {
            if (
              !e.target.value ||
              (/^[1-9][0-9]{0,4}$/.test(e.target.value) &&
                Number(e.target.value) <= 65535)
            ) {
              setLevel(e.target.value);
              setPage(1);
            }
          }}
        />
        <Select
          label="نوع المتطلب"
          value={requirement}
          onChange={(e) => {
            setRequirement(e.target.value);
            setPage(1);
          }}
        >
          <option value="">كل التصنيفات</option>
          <option value="REQUIRED">إجباري</option>
          <option value="ELECTIVE">اختياري</option>
          <option value="UNVERIFIED">غير متحقق</option>
        </Select>
      </div>
      {profile.error ? (
        <ErrorState error={profile.error} retry={() => void profile.refetch()} />
      ) : courses.error ? (
        <ErrorState error={courses.error} retry={() => void courses.refetch()} />
      ) : courses.isPending ? (
        <Skeleton />
      ) : (
        <>
          <div className="results-heading">
            <span>{number(courses.data.pagination.total)} مساق مطابق</span>
            <small>إنجاز المساق يعتمد على إقرارك الشخصي</small>
          </div>
          {courses.data.data.length ? (
            <div className="course-grid">
              {courses.data.data.map((c) => (
                <CourseCard
                  key={c.course_code}
                  course={c}
                  completed={
                    completed.isPending || completed.error
                      ? null
                      : codes.has(c.course_code)
                  }
                />
              ))}
            </div>
          ) : (
            <Empty
              title="لا توجد مساقات مطابقة"
              description="جرّب اسمًا آخر أو عدّل بعض المرشحات."
            />
          )}
          <div className="pagination">
            <Button
              variant="secondary"
              disabled={page === 1 || courses.isFetching}
              onClick={() => setPage(page - 1)}
            >
              <ArrowRight size={16} /> السابق
            </Button>
            <span>
              صفحة {number(page)} من{" "}
              {number(Math.max(1, Math.ceil(courses.data.pagination.total / 12)))}
            </span>
            <Button
              variant="secondary"
              disabled={page * 12 >= courses.data.pagination.total || courses.isFetching}
              onClick={() => setPage(page + 1)}
            >
              التالي
              <ArrowLeft size={16} />
            </Button>
          </div>
        </>
      )}
      {completed.error && (
        <ErrorState error={completed.error} retry={() => void completed.refetch()} />
      )}
      <section className="surface elective-summary">
        <div className="section-heading">
          <h2>مجموعات الاختياري</h2>
          <Badge>خيارات، وليست جميعها إلزامية</Badge>
        </div>
        {groups.error ? (
          <ErrorState error={groups.error} retry={() => void groups.refetch()} />
        ) : groups.isPending ? (
          <Skeleton />
        ) : groups.data?.length ? (
          groups.data.map((g) => (
            <div className="elective-line" key={g.id}>
              <div>
                <strong>{g.name_ar}</strong>
                <p>{number(g.courses?.length)} مساق متاح في هذه المجموعة</p>
              </div>
              <Badge tone="teal">
                المطلوب: {number(g.required_credit_hours)} ساعة
                {g.required_credit_hours === 12 ? " · تعادل 4 مساقات" : ""}
              </Badge>
            </div>
          ))
        ) : (
          <p className="muted">لم تُسجل متطلبات الاختياري لهذه الخطة بعد.</p>
        )}
      </section>
    </>
  );
}
