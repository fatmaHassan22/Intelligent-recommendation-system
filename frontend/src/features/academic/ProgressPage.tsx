import { BookOpen, CheckCheck, GraduationCap, Layers3, ShieldCheck } from "lucide-react";
import { useProgress } from "../../shared/hooks/academic";
import {
  Badge,
  Empty,
  ErrorState,
  Notice,
  PageHeader,
  Skeleton,
  Stat,
  number,
} from "../../shared/ui";
import { Completeness } from "./Completeness";
import { GroupCard } from "./CourseDetails";

export function ProgressPage() {
  const query = useProgress();
  if (query.error)
    return <ErrorState error={query.error} retry={() => void query.refetch()} />;
  if (query.isPending) return <Skeleton />;
  const p = query.data;
  return (
    <>
      <PageHeader
        eyebrow="معلوماتك كما هي"
        title="التقدم الأكاديمي"
        description="تتبع المساقات والساعات المعروفة دون اعتبار كل الخيارات الاختيارية إلزامية."
      />
      <div className="stats-grid">
        <Stat
          label="الساعات المنجزة المعروفة"
          value={number(p.known_completed_credit_hours)}
          hint={`${number(p.completed_credit_summary.unknown_credit_course_count)} مساق منجز بساعات مجهولة`}
          icon={<GraduationCap />}
        />
        <Stat
          label="إجباري منجز"
          value={number(p.completed_required_courses)}
          hint="وفق التصنيف المعروف في خطتك"
          icon={<BookOpen />}
        />
        <Stat
          label="اختياري منجز"
          value={number(p.completed_elective_courses)}
          hint={`${number(p.completed_elective_hours)} ساعة اختيارية`}
          icon={<CheckCheck />}
        />
        <Stat
          label="مساقات غير منجزة"
          value={number(p.remaining_course_count)}
          hint="تشمل البدائل والخيارات الاختيارية"
          icon={<Layers3 />}
        />
      </div>
      <div className="dashboard-columns">
        <section className="surface">
          <div className="section-heading">
            <h2>متطلبات الاختياري</h2>
            <Badge tone="teal">المطلوب: {number(p.required_elective_hours)} ساعة</Badge>
          </div>
          {p.elective_groups.length ? (
            p.elective_groups.map((g) => <GroupCard group={g} key={g.id} />)
          ) : (
            <Empty
              title="متطلبات الاختياري غير معروفة"
              description="لم تُسجل أهداف مجموعات الاختياري لهذه الخطة بعد."
            />
          )}
          {p.elective_group_totals_may_overlap && (
            <Notice>
              قد يتاح المساق في أكثر من مجموعة. مجموعات العرض لا تمثل قرارًا بالسماح
              باحتسابه مرتين.
            </Notice>
          )}
        </section>
        <section className="surface">
          <div className="section-heading">
            <h2>اكتمال البيانات الأكاديمية</h2>
            <Badge tone="amber">
              {p.is_degree_audit_complete ? "بحسب حالة الخادم" : "غير مكتملة"}
            </Badge>
          </div>
          <div className="audit-status">
            <ShieldCheck size={35} />
            <h3>الوضوح أهم من رقم غير دقيق</h3>
            <p>
              لا يمكن تأكيد اكتمال متطلبات الدرجة أو احتساب نسبة تخرج رسمية من البيانات
              الحالية.
            </p>
          </div>
          <dl className="review">
            <div>
              <dt>إجمالي ساعات الخطة</dt>
              <dd>{number(p.total_plan_credit_hours)}</dd>
            </div>
            <div>
              <dt>تصنيف الإنجاز غير المتحقق</dt>
              <dd>{number(p.completed_unverified_courses)} مساق</dd>
            </div>
            <div>
              <dt>ساعات منجزة غير معروفة</dt>
              <dd>
                {number(p.completed_credit_summary.unknown_credit_course_count)} مساق
              </dd>
            </div>
          </dl>
          <ul className="limitation-list">
            {p.degree_audit_limitations.map((code) => (
              <li key={code}>
                {{
                  DEGREE_WIDE_REQUIREMENTS_NOT_FULLY_SUPPLIED:
                    "بقية متطلبات الدرجة لم تُقدم كاملة.",
                  UNVERIFIED_CLASSIFICATIONS: "تصنيف بعض مساقات الخطة غير متحقق.",
                  UNKNOWN_CREDIT_HOURS: "ساعات بعض مساقات الخطة غير معروفة.",
                }[code] ?? "توجد معلومات أكاديمية تحتاج استكمالًا."}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Completeness />
    </>
  );
}
