import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CheckCheck,
  Clock3,
  GraduationCap,
  Plus,
  Compass,
  CalendarDays,
} from "lucide-react";
import type { Course, Progress } from "../../shared/api/types";
import { useAuth } from "../auth/AuthProvider";
import {
  useCompleted,
  useMajors,
  usePlans,
  useProfile,
  useProgress,
} from "../../shared/hooks/academic";
import { Badge, ErrorState, Skeleton, Stat, number } from "../../shared/ui";
import { EngagementDashboard } from "../engagement/EngagementDashboard";
import { ProductivityDashboard } from "../productivity/ProductivityDashboard";
import { Completeness } from "./Completeness";

function WelcomeBanner({
  studentName,
  majorName,
  planNumber,
  totalHours,
}: {
  studentName: string;
  majorName: string;
  planNumber: string;
  totalHours: string;
}) {
  return (
    <section
      className="welcome-banner dashboard-hero"
      aria-labelledby="dashboard-welcome-title"
    >
      <div className="dashboard-hero-copy">
        <Badge tone="teal">مسارك الجامعي</Badge>
        <p className="dashboard-greeting">أهلًا، {studentName}</p>
        <h1 id="dashboard-welcome-title">{majorName}</h1>
        <p>
          الخطة {planNumber} <span>·</span> {totalHours} ساعة في خطتك
        </p>
        <div className="dashboard-hero-actions">
          <Link className="btn dashboard-hero-button" to="/app/curriculum">
            استكشف الخطة الدراسية
            <ArrowLeft size={17} />
          </Link>
          <Link className="dashboard-hero-textlink" to="/app/planner">
            خطّط للفصل القادم
          </Link>
          <Link className="dashboard-hero-textlink" to="/app/profile">
            ملفي الأكاديمي
          </Link>
        </div>
      </div>
      <div className="banner-art" aria-hidden="true">
        <div className="art-orbit" />
        <GraduationCap size={75} />
        <span>
          <BookOpen size={19} />
        </span>
      </div>
    </section>
  );
}

function StatsGrid({ progress }: { progress: Progress }) {
  return (
    <section
      className="dashboard-progress-section"
      aria-labelledby="dashboard-summary-title"
    >
      <div className="dashboard-section-intro">
        <div>
          <span className="section-kicker">ملخص رحلتك</span>
          <h2 id="dashboard-summary-title">تقدمك الدراسي</h2>
        </div>
        <Link to="/app/progress">
          تفاصيل التقدم
          <ArrowLeft size={15} />
        </Link>
      </div>
      <div className="stats-grid dashboard-stats">
        <Stat
          label="الساعات المطلوب إنجازها"
          value={number(87)}
          hint="إجمالي الساعات المطلوبة للتخرج"
          icon={<Clock3 size={23} />}
        />
        <Stat
          label="الساعات المنجزة"
          value={number(progress.known_completed_credit_hours)}
          hint={
            progress.completed_credit_summary.unknown_credit_course_count
              ? `${number(progress.completed_credit_summary.unknown_credit_course_count)} مساق بساعات غير معروفة`
              : "بحسب المساقات المُعلن اجتيازها"
          }
          icon={<GraduationCap size={23} />}
        />
        <Stat
          label="المساقات المطلوب إنجازها"
          value={number(30)}
          hint="إجمالي المساقات المطلوبة للتخرج"
          icon={<BookOpen size={23} />}
        />
        <Stat
          label="المساقات المنجزة"
          value={number(progress.completed_course_count)}
          hint="بحسب إقرار الإنجاز في التطبيق"
          icon={<CheckCheck size={23} />}
        />
      </div>
    </section>
  );
}

function RecentCourses({ courses }: { courses: Course[] }) {
  return (
    <section className="surface dashboard-recent-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">خطوة بخطوة</span>
          <h2>إنجازاتك الأخيرة</h2>
          <p className="dashboard-subheading">المساقات المُضافة إلى سجل الإنجاز</p>
        </div>
        <Link to="/app/completed">
          عرض السجل
          <ArrowLeft size={15} />
        </Link>
      </div>
      {courses.length ? (
        courses.map((course) => (
          <Link
            className="recent-course"
            key={course.course_code}
            to={`/app/curriculum/${course.course_code}`}
          >
            <span className="course-mini-icon">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <h3>{course.name_ar}</h3>
              <small>
                <bdi>{course.course_code}</bdi> · {number(course.credit_hours)} ساعة
              </small>
            </div>
            <ArrowLeft size={17} />
          </Link>
        ))
      ) : (
        <div className="dashboard-empty-progress">
          <span className="course-mini-icon">
            <CheckCircle2 size={22} />
          </span>
          <div>
            <strong>سجلك جاهز لأول إنجاز</strong>
            <p>أضف مساقًا أُعلن اجتيازه، وسيظهر هنا مع ساعات الخطة.</p>
          </div>
          <Link className="btn btn-secondary" to="/app/completed">
            إضافة إنجاز
            <Plus size={16} />
          </Link>
        </div>
      )}
    </section>
  );
}

function QuickActions({ firstStep }: { firstStep: boolean }) {
  return (
    <section
      className="dashboard-quick-actions"
      aria-labelledby="dashboard-actions-title"
    >
      <div className="dashboard-more-heading">
        <span className="section-kicker">خطوتك القادمة</span>
        <h2 id="dashboard-actions-title">اختر ما تريد إنجازه</h2>
      </div>
      <div className="dashboard-action-grid">
        <article className="surface dashboard-next-step">
          <div className="dashboard-card-heading">
            <span className="dashboard-feature-icon next">
              <Compass size={20} />
            </span>
            <div>
              <span className="section-kicker">اقتراح للخطوة القادمة</span>
              <h3>{firstStep ? "أضف إنجازك الأول" : "نظّم خطتك الدراسية"}</h3>
            </div>
          </div>
          <p>
            {firstStep
              ? "أضف المساقات التي اجتزتها ليصبح ملخصك الدراسي أوضح."
              : "راجع مساقات خطتك ومتطلباتها، ثم جهّز الفصل المناسب."}
          </p>
          <Link
            className="btn btn-primary"
            to={firstStep ? "/app/completed" : "/app/planner"}
          >
            {firstStep ? "إضافة مساق منجز" : "فتح المخطط الدراسي"}
            <ArrowLeft size={16} />
          </Link>
        </article>
        <div className="dashboard-shortcuts">
          <Link className="dashboard-shortcut" to="/app/curriculum">
            <span className="shortcut-icon">
              <BookOpen size={20} />
            </span>
            <span>
              <strong>دليل المساقات</strong>
              <small>تصفح الخطة ومتطلباتها</small>
            </span>
            <ArrowLeft size={16} />
          </Link>
          <Link className="dashboard-shortcut" to="/app/planner">
            <span className="shortcut-icon">
              <CalendarDays size={20} />
            </span>
            <span>
              <strong>المخطط الدراسي</strong>
              <small>جهّز مسودة للفصل القادم</small>
            </span>
            <ArrowLeft size={16} />
          </Link>
          <Link className="dashboard-shortcut" to="/app/completed">
            <span className="shortcut-icon">
              <CheckCheck size={20} />
            </span>
            <span>
              <strong>سجل الإنجاز</strong>
              <small>أدر المساقات المنجزة</small>
            </span>
            <ArrowLeft size={16} />
          </Link>
          <Link className="dashboard-shortcut" to="/app/tasks">
            <span className="shortcut-icon">
              <Clock3 size={20} />
            </span>
            <span>
              <strong>المهام اليومية</strong>
              <small>راجع مهامك ومواعيدك</small>
            </span>
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Dashboard() {
  const auth = useAuth(),
    profile = useProfile(),
    progress = useProgress(),
    completed = useCompleted(),
    majors = useMajors(),
    plans = usePlans(String(profile.data?.major_id ?? ""));
  if (profile.isPending || progress.isPending || completed.isPending) return <Skeleton />;
  if (profile.error || progress.error || completed.error || majors.error || plans.error)
    return (
      <ErrorState
        error={
          profile.error ??
          progress.error ??
          completed.error ??
          majors.error ??
          plans.error
        }
        retry={() => {
          void profile.refetch();
          void progress.refetch();
          void completed.refetch();
          void majors.refetch();
          void plans.refetch();
        }}
      />
    );
  const current = profile.data!,
    summary = progress.data!,
    major = majors.data?.find((item) => String(item.id) === String(current.major_id)),
    plan = plans.data?.find(
      (item) => String(item.id) === String(current.curriculum_plan_id),
    );
  const recent = [...(completed.data ?? [])]
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .slice(0, 3);
  const firstStep = summary.completed_course_count === 0;
  return (
    <div className="student-dashboard">
      <WelcomeBanner
        studentName={auth.user?.full_name.split(" ")[0] || "طالب"}
        majorName={major?.name_ar ?? "تخصصك الدراسي"}
        planNumber={plan ? number(plan.plan_number) : "…"}
        totalHours={number(plan?.total_credit_hours)}
      />
      <ProductivityDashboard />
      <StatsGrid progress={summary} />
      <RecentCourses courses={recent} />
      <QuickActions firstStep={firstStep} />
      <div className="dashboard-data-note">
        <Completeness />
      </div>
      <section className="dashboard-more-section">
        <EngagementDashboard />
      </section>
    </div>
  );
}
