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
import {
  Badge,
  ErrorState,
  Skeleton,
  Stat,
  number,
  buttonClass,
} from "../../shared/ui";
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
        <p className=" !text-white/90 mt-5 text-2xl font-bold">
          أهلًا {studentName}
        </p>
        <h1 id="dashboard-welcome-title">{majorName}</h1>
        <p className="!text-white/80">
          الخطة {planNumber} <span className="!text-white/60">·</span>{" "}
          {totalHours} ساعة في خطتك
        </p>
        <div className="dashboard-hero-actions">
          <Link
            className="inline-flex items-center gap-2 rounded-control bg-white px-4 py-2.5 text-[13px] font-bold !text-[#143348] shadow-pop transition hover:bg-white/90"
            to="/app/curriculum"
          >
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
          <p className="dashboard-subheading">
            المساقات المُضافة إلى سجل الإنجاز
          </p>
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
                <bdi>{course.course_code}</bdi> · {number(course.credit_hours)}{" "}
                ساعة
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
          <Link className={buttonClass("secondary")} to="/app/completed">
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
            className={buttonClass("primary")}
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
  if (profile.isPending || progress.isPending || completed.isPending)
    return <Skeleton />;
  if (
    profile.error ||
    progress.error ||
    completed.error ||
    majors.error ||
    plans.error
  )
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
    major = majors.data?.find(
      (item) => String(item.id) === String(current.major_id),
    ),
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
        planNumber={plan ? String(plan.plan_number) : "…"}
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

// import { Link } from "react-router-dom";
// import {
//   ArrowLeft,
//   BookOpen,
//   CheckCircle2,
//   CheckCheck,
//   Clock3,
//   GraduationCap,
//   Plus,
//   Compass,
//   CalendarDays,
//   Sparkles,
// } from "lucide-react";
// import type { Course, Progress } from "../../shared/api/types";
// import { useAuth } from "../auth/AuthProvider";
// import {
//   useCompleted,
//   useMajors,
//   usePlans,
//   useProfile,
//   useProgress,
// } from "../../shared/hooks/academic";
// import { ErrorState, Skeleton, number } from "../../shared/ui";
// import { EngagementDashboard } from "../engagement/EngagementDashboard";
// import { ProductivityDashboard } from "../productivity/ProductivityDashboard";
// import { Completeness } from "./Completeness";
// import "./dashboard.css";

// function WelcomeBanner({
//   studentName,
//   majorName,
//   planNumber,
//   totalHours,
// }: {
//   studentName: string;
//   majorName: string;
//   planNumber: string;
//   totalHours: string;
// }) {
//   return (
//     <section
//       className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-[#0f4c5c] via-[#143d52] to-[#1a2e44] p-6 sm:p-8 lg:p-10 text-white shadow-lg shadow-slate-900/10"
//       aria-labelledby="dashboard-welcome-title"
//     >
//       {/* دوائر زخرفية ناعمة في الخلفية */}
//       <div
//         className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-teal-400/10 blur-2xl"
//         aria-hidden="true"
//       />
//       <div
//         className="pointer-events-none absolute -bottom-20 right-1/3 h-56 w-56 rounded-full bg-sky-400/10 blur-2xl"
//         aria-hidden="true"
//       />

//       <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
//         <div className="max-w-2xl space-y-3">
//           <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-300/25 bg-teal-400/15 px-3.5 py-1 text-xs font-bold text-teal-100 backdrop-blur-sm">
//             <Sparkles size={14} className="text-teal-300" />
//             مسارك الجامعي
//           </span>

//           <p className="pt-1 text-lg sm:text-xl font-semibold text-teal-50/90">
//             أهلًا بك، {studentName} 👋
//           </p>

//           <h1
//             id="dashboard-welcome-title"
//             className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold leading-snug tracking-tight text-white"
//           >
//             {majorName}
//           </h1>

//           <p className="flex flex-wrap items-center gap-2 text-sm text-slate-200/90">
//             <span className="rounded-md bg-white/10 px-2.5 py-0.5 font-semibold">
//               الخطة {planNumber}
//             </span>
//             <span className="text-white/40">•</span>
//             <span>إجمالي {totalHours} ساعة معتمدة في خطتك</span>
//           </p>

//           <div className="flex flex-wrap items-center gap-3 pt-3">
//             <Link
//               className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#143348] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-50 hover:shadow-md"
//               to="/app/curriculum"
//             >
//               استكشف الخطة الدراسية
//               <ArrowLeft size={17} />
//             </Link>

//             <Link
//               className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20"
//               to="/app/planner"
//             >
//               خطّط للفصل القادم
//             </Link>

//             <Link
//               className="px-3 py-2 text-sm font-medium text-teal-100/90 underline-offset-4 transition hover:text-white hover:underline"
//               to="/app/profile"
//             >
//               ملفي الأكاديمي
//             </Link>
//           </div>
//         </div>

//         {/* أيقونة تزيينية متجاوبة */}
//         <div
//           className="hidden sm:flex relative h-28 w-28 lg:h-32 lg:w-32 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/10 backdrop-blur-md shadow-inner"
//           aria-hidden="true"
//         >
//           <GraduationCap
//             size={64}
//             className="text-teal-200/90"
//             strokeWidth={1.5}
//           />
//           <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md">
//             <BookOpen size={18} />
//           </span>
//         </div>
//       </div>
//     </section>
//   );
// }

// function StatsGrid({ progress }: { progress: Progress }) {
//   const totalRequiredHours = 87;
//   const completedHours = progress.known_completed_credit_hours || 0;
//   const hoursPercentage = Math.min(
//     100,
//     Math.round((completedHours / totalRequiredHours) * 100),
//   );

//   const statsItems = [
//     {
//       label: "الساعات المنجزة",
//       value: number(completedHours),
//       subValue: `من أصل ${number(totalRequiredHours)} ساعة`,
//       hint: progress.completed_credit_summary.unknown_credit_course_count
//         ? `${number(progress.completed_credit_summary.unknown_credit_course_count)} مساق بساعات غير معروفة`
//         : `نسبة الإنجاز ${number(hoursPercentage)}%`,
//       icon: <GraduationCap size={22} />,
//       colorClass: "bg-teal-50 text-teal-700 border-teal-100",
//       progress: hoursPercentage,
//     },
//     {
//       label: "الساعات المتبقية",
//       value: number(Math.max(0, totalRequiredHours - completedHours)),
//       subValue: "ساعة للتخرج",
//       hint: `إجمالي الخطة ${number(totalRequiredHours)} ساعة`,
//       icon: <Clock3 size={22} />,
//       colorClass: "bg-sky-50 text-sky-700 border-sky-100",
//     },
//     {
//       label: "المساقات المنجزة",
//       value: number(progress.completed_course_count),
//       subValue: `من أصل ${number(30)} مساق`,
//       hint: "بحسب إقرار الإنجاز في التطبيق",
//       icon: <CheckCheck size={22} />,
//       colorClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
//     },
//     {
//       label: "إجمالي مساقات الخطة",
//       value: number(30),
//       subValue: "مساق دراسي",
//       hint: "المساقات المطلوبة للتخرج",
//       icon: <BookOpen size={22} />,
//       colorClass: "bg-indigo-50 text-indigo-700 border-indigo-100",
//     },
//   ];

//   return (
//     <section className="space-y-4" aria-labelledby="dashboard-summary-title">
//       <div className="flex flex-wrap items-end justify-between gap-2">
//         <div>
//           <span className="text-xs font-bold tracking-wide text-teal-700">
//             ملخص رحلتك
//           </span>
//           <h2
//             id="dashboard-summary-title"
//             className="text-xl font-extrabold text-slate-800"
//           >
//             تقدمك الدراسي
//           </h2>
//         </div>
//         <Link
//           to="/app/progress"
//           className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
//         >
//           تفاصيل التقدم
//           <ArrowLeft size={15} />
//         </Link>
//       </div>

//       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//         {statsItems.map((item, idx) => (
//           <div
//             key={idx}
//             className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
//           >
//             <div className="flex items-start justify-between gap-3">
//               <div className="space-y-1">
//                 <p className="text-xs font-semibold text-slate-500">
//                   {item.label}
//                 </p>
//                 <div className="flex items-baseline gap-1.5">
//                   <strong className="text-2xl sm:text-3xl font-extrabold text-slate-900">
//                     {item.value}
//                   </strong>
//                   <span className="text-xs font-medium text-slate-400">
//                     {item.subValue}
//                   </span>
//                 </div>
//               </div>
//               <span
//                 className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${item.colorClass} transition-transform duration-200 group-hover:scale-105`}
//               >
//                 {item.icon}
//               </span>
//             </div>

//             <div className="mt-4 space-y-2">
//               {typeof item.progress === "number" && (
//                 <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
//                   <div
//                     className="h-full rounded-full bg-teal-600 transition-all duration-500"
//                     style={{ width: `${item.progress}%` }}
//                   />
//                 </div>
//               )}
//               <small className="block text-xs text-slate-500">
//                 {item.hint}
//               </small>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

// function RecentCourses({ courses }: { courses: Course[] }) {
//   return (
//     <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
//       <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
//         <div>
//           <span className="text-xs font-bold text-teal-700">خطوة بخطوة</span>
//           <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
//             إنجازاتك الأخيرة
//           </h2>
//           <p className="mt-0.5 text-xs text-slate-500">
//             آخر المساقات المُضافة إلى سجل الإنجاز
//           </p>
//         </div>
//         <Link
//           to="/app/completed"
//           className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
//         >
//           عرض السجل الكامل
//           <ArrowLeft size={14} />
//         </Link>
//       </div>

//       {courses.length ? (
//         <div className="divide-y divide-slate-100">
//           {courses.map((course) => (
//             <Link
//               className="group flex items-center justify-between gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-slate-50/90"
//               key={course.course_code}
//               to={`/app/curriculum/${course.course_code}`}
//             >
//               <div className="flex items-center gap-3.5 min-w-0">
//                 <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
//                   <CheckCircle2 size={20} />
//                 </span>
//                 <div className="min-w-0">
//                   <h3 className="truncate text-sm font-bold text-slate-800 group-hover:text-teal-800">
//                     {course.name_ar}
//                   </h3>
//                   <small className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
//                     <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600">
//                       <bdi>{course.course_code}</bdi>
//                     </span>
//                     <span>•</span>
//                     <span>{number(course.credit_hours)} ساعة معتمدة</span>
//                   </small>
//                 </div>
//               </div>
//               <ArrowLeft
//                 size={16}
//                 className="shrink-0 text-slate-400 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-teal-700"
//               />
//             </Link>
//           ))}
//         </div>
//       ) : (
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5">
//           <div className="flex items-start gap-3.5">
//             <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
//               <CheckCircle2 size={22} />
//             </span>
//             <div className="space-y-1">
//               <strong className="block text-sm font-bold text-slate-800">
//                 سجلك جاهز لأول إنجاز
//               </strong>
//               <p className="text-xs leading-relaxed text-slate-500">
//                 أضف مساقًا أُعلن اجتيازه، وسيظهر هنا مباشرة مع احتساب ساعاته في
//                 خطتك.
//               </p>
//             </div>
//           </div>
//           <Link
//             className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"
//             to="/app/completed"
//           >
//             إضافة إنجاز
//             <Plus size={15} />
//           </Link>
//         </div>
//       )}
//     </section>
//   );
// }

// function QuickActions({ firstStep }: { firstStep: boolean }) {
//   const shortcuts = [
//     {
//       title: "دليل المساقات",
//       desc: "تصفح الخطة ومتطلباتها",
//       to: "/app/curriculum",
//       icon: <BookOpen size={20} />,
//       accent:
//         "bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white",
//     },
//     {
//       title: "المخطط الدراسي",
//       desc: "جهّز مسودة للفصل القادم",
//       to: "/app/planner",
//       icon: <CalendarDays size={20} />,
//       accent:
//         "bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white",
//     },
//     {
//       title: "سجل الإنجاز",
//       desc: "أدر المساقات المنجزة",
//       to: "/app/completed",
//       icon: <CheckCheck size={20} />,
//       accent:
//         "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
//     },
//     {
//       title: "المهام اليومية",
//       desc: "راجع مهامك ومواعيدك",
//       to: "/app/tasks",
//       icon: <Clock3 size={20} />,
//       accent:
//         "bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white",
//     },
//   ];

//   return (
//     <section className="space-y-4" aria-labelledby="dashboard-actions-title">
//       <div>
//         <span className="text-xs font-bold text-teal-700">خطوتك القادمة</span>
//         <h2
//           id="dashboard-actions-title"
//           className="text-xl font-extrabold text-slate-800"
//         >
//           اختر ما تريد إنجازه
//         </h2>
//       </div>

//       <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
//         {/* بطاقة الاقتراح الذكي */}
//         <article className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/70 via-white to-sky-50/50 p-6 shadow-sm">
//           <div className="space-y-4">
//             <div className="flex items-center gap-3">
//               <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
//                 <Compass size={22} />
//               </span>
//               <div>
//                 <span className="text-[11px] font-bold text-teal-700">
//                   اقتراح للخطوة القادمة
//                 </span>
//                 <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
//                   {firstStep ? "أضف إنجازك الأول" : "نظّم خطتك الدراسية"}
//                 </h3>
//               </div>
//             </div>

//             <p className="text-sm leading-relaxed text-slate-600">
//               {firstStep
//                 ? "أضف المساقات التي اجتزتها ليصبح ملخصك الدراسي أوضح وتتمكن من تتبع الساعات المتبقية بدقة."
//                 : "راجع مساقات خطتك ومتطلباتها السابقة، ثم جهّز جدولك المقترح للفصل القادم بكل سهولة."}
//             </p>
//           </div>

//           <div className="pt-5">
//             <Link
//               className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-800 hover:shadow"
//               to={firstStep ? "/app/completed" : "/app/planner"}
//             >
//               {firstStep ? "إضافة مساق منجز" : "فتح المخطط الدراسي"}
//               <ArrowLeft size={16} />
//             </Link>
//           </div>
//         </article>

//         {/* شبكة الاختصارات */}
//         <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
//           {shortcuts.map((item) => (
//             <Link
//               key={item.to}
//               to={item.to}
//               className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
//             >
//               <div className="flex items-center gap-3.5 min-w-0">
//                 <span
//                   className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${item.accent}`}
//                 >
//                   {item.icon}
//                 </span>
//                 <div className="min-w-0">
//                   <strong className="block truncate text-sm font-bold text-slate-800 group-hover:text-teal-800">
//                     {item.title}
//                   </strong>
//                   <small className="block truncate text-xs text-slate-500">
//                     {item.desc}
//                   </small>
//                 </div>
//               </div>
//               <ArrowLeft
//                 size={16}
//                 className="shrink-0 text-slate-400 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-teal-700"
//               />
//             </Link>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// export function Dashboard() {
//   const auth = useAuth(),
//     profile = useProfile(),
//     progress = useProgress(),
//     completed = useCompleted(),
//     majors = useMajors(),
//     plans = usePlans(String(profile.data?.major_id ?? ""));

//   if (profile.isPending || progress.isPending || completed.isPending)
//     return <Skeleton />;

//   if (
//     profile.error ||
//     progress.error ||
//     completed.error ||
//     majors.error ||
//     plans.error
//   )
//     return (
//       <ErrorState
//         error={
//           profile.error ??
//           progress.error ??
//           completed.error ??
//           majors.error ??
//           plans.error
//         }
//         retry={() => {
//           void profile.refetch();
//           void progress.refetch();
//           void completed.refetch();
//           void majors.refetch();
//           void plans.refetch();
//         }}
//       />
//     );

//   const current = profile.data!,
//     summary = progress.data!,
//     major = majors.data?.find(
//       (item) => String(item.id) === String(current.major_id),
//     ),
//     plan = plans.data?.find(
//       (item) => String(item.id) === String(current.curriculum_plan_id),
//     );

//   const recent = [...(completed.data ?? [])]
//     .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
//     .slice(0, 3);

//   const firstStep = summary.completed_course_count === 0;

//   return (
//     <div className="student-dashboard mx-auto max-w-7xl space-y-8 pb-10">
//       <WelcomeBanner
//         studentName={auth.user?.full_name.split(" ")[0] || "طالب"}
//         majorName={major?.name_ar ?? "تخصصك الدراسي"}
//         planNumber={plan ? String(plan.plan_number) : "…"}
//         totalHours={number(plan?.total_credit_hours)}
//       />

//       <ProductivityDashboard />

//       <StatsGrid progress={summary} />

//       <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
//         <div className="lg:col-span-12">
//           <RecentCourses courses={recent} />
//         </div>
//       </div>

//       <QuickActions firstStep={firstStep} />

//       <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4">
//         <Completeness />
//       </div>

//       <section>
//         <EngagementDashboard />
//       </section>
//     </div>
//   );
// }
