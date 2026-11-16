import { BookOpen, CheckCheck, Layers3, Route } from "lucide-react";
import type { AcademicTerm, DraftCourse, DraftValidation, Recommendation } from "./api";
import { Badge, Confirm, Stat, number } from "../../shared/ui";

export function StudyOptions() {
  return (
    <>
      <option value="LIGHT">خفيف</option>
      <option value="BALANCED">متوازن</option>
      <option value="FAST_GRADUATION">تخرج أسرع</option>
    </>
  );
}

export function TermOptions({ terms }: { terms: AcademicTerm[] }) {
  return (
    <>
      <option value="">بدون فصل محدد</option>
      {terms.map((t) => (
        <option key={t.id} value={t.id}>
          {t.academic_year} · {t.semester_name_ar}
        </option>
      ))}
    </>
  );
}

export function Credits({ validation }: { validation: DraftValidation }) {
  const c = validation.credit_summary;
  return (
    <div className="stats-grid planning-stats">
      <Stat
        label="الساعات المعروفة"
        value={number(c.known_credit_hours)}
        hint={
          c.is_total_complete
            ? "إجمالي الساعات مكتمل"
            : "هذا الجزء المعروف فقط؛ الإجمالي غير مكتمل"
        }
        icon={<BookOpen />}
      />
      <Stat
        label="مساقات بساعات مجهولة"
        value={number(c.unknown_credit_course_count)}
        hint="لم تُحسب ساعاتها كصفر"
        icon={<Layers3 />}
      />
      <Stat
        label="السعة المتبقية"
        value={number(c.remaining_credit_capacity)}
        hint={
          c.exceeds_configured_max
            ? "تجاوزتِ الحد المفضل"
            : `الحد المفضل: ${number(c.configured_max_credit_hours)} ساعة`
        }
        icon={<Route />}
      />
      <Stat
        label="حمل الدراسة المتحقق"
        value={number(validation.workload.total_score)}
        hint={
          validation.workload.unknown_course_count
            ? "بيانات الصعوبة غير مكتملة؛ ليست ساعات معتمدة"
            : "نقاط صعوبة متحققة منفصلة عن الساعات"
        }
        icon={<CheckCheck />}
      />
    </div>
  );
}

export function Evaluation({
  course,
}: {
  course: DraftCourse & { ranking?: Recommendation["ranking"] };
}) {
  return (
    <details className="evaluation-details">
      <summary>لماذا؟ المتطلبات وعوامل الترتيب</summary>
      <ul>
        {course.reasons.map((r) => (
          <li key={r.code}>{r.text_ar}</li>
        ))}
      </ul>
      {!!course.prerequisites.groups.length && (
        <div className="mini-prerequisites">
          <p>
            كل بند مطلوب (و)؛ داخل البند يكفي بديل واحد (أو). الاختيارات في المسودة ليست
            إنجازًا.
          </p>
          {course.prerequisites.groups.map((g) => (
            <div key={g.group_number}>
              <strong>البند {number(g.group_number)}</strong>
              <span>
                {g.courses.map((code, i) => (
                  <span key={code}>
                    {i > 0 ? " أو " : ""}
                    <bdi>{code}</bdi>
                  </span>
                ))}
              </span>
              <Badge
                tone={
                  g.satisfied &&
                  !course.prerequisites.is_unverified &&
                  !course.prerequisites.requires_academic_review
                    ? "teal"
                    : "amber"
                }
              >
                {course.prerequisites.is_unverified ||
                course.prerequisites.requires_academic_review
                  ? "غير متحقق"
                  : g.satisfied
                    ? "مستوفى"
                    : "غير مستوفى"}
              </Badge>
            </div>
          ))}
        </div>
      )}
      {course.category === "SUITABLE" && course.ranking && (
        <div className="ranking-factors">
          <strong>نقاط الترتيب: {number(course.ranking.score)}</strong>
          {course.ranking.factors.length ? (
            <ul>
              {course.ranking.factors.map((f) => (
                <li key={f.code}>
                  {f.label_ar}: {number(f.points)} نقطة
                </li>
              ))}
            </ul>
          ) : (
            <p>
              لا توجد عوامل متحققة تميّز ترتيب هذا المساق؛ يُستخدم رمز المساق لكسر التعادل.
            </p>
          )}
        </div>
      )}
    </details>
  );
}

export function AddWarning({
  course,
  busy,
  onConfirm,
  onClose,
}: {
  course: Recommendation;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Confirm
      title="حفظ المساق للمراجعة؟"
      description={`${course.name_ar}: ${course.reasons
        .filter(
          (r) => !["DIFFICULTY_UNKNOWN", "CLASSIFICATION_UNVERIFIED"].includes(r.code),
        )
        .map((r) => r.text_ar)
        .join(" ")} سيُحفظ في المسودة مع التحذيرات، ولن يُعتبر مستوفيًا للشروط.`}
      busy={busy}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
