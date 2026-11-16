import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Plus, Save, Trash2 } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type { Result, StudyMode } from "../../shared/api/types";
import type { Draft } from "./api";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Input,
  Modal,
  Notice,
  PageHeader,
  Select,
  Skeleton,
  modeLabel,
  number,
  useToast,
} from "../../shared/ui";
import { prefix, useDrafts, useTerms, useRefreshPlanning } from "./hooks";
import { StudyOptions, TermOptions } from "./components";

export function PlannerPage() {
  const drafts = useDrafts(),
    terms = useTerms(),
    toast = useToast(),
    refresh = useRefreshPlanning(),
    navigate = useNavigate();
  const [creating, setCreating] = useState(false),
    [name, setName] = useState(""),
    [term, setTerm] = useState(""),
    [mode, setMode] = useState<StudyMode | "">(""),
    [deleting, setDeleting] = useState<Draft | null>(null);
  const create = useMutation({
    mutationFn: () =>
      api.mutate<Result<Draft>>(`${prefix}/semester-plans`, "POST", {
        name: name.trim(),
        academic_term_id: term || null,
        ...(mode ? { study_mode: mode } : {}),
      }),
    onSuccess: async (r) => {
      await refresh(r.data);
      setCreating(false);
      setName("");
      toast("حُفظت المسودة الجديدة.");
      navigate(`/app/planner/${r.data.id}`);
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const remove = useMutation({
    mutationFn: (p: Draft) =>
      api.mutate(`${prefix}/semester-plans/${p.id}`, "DELETE", {
        expected_revision: p.revision,
      }),
    onSuccess: async () => {
      setDeleting(null);
      await refresh();
      toast("حُذفت المسودة.");
    },
    onError: async (e) => {
      toast(errorMessage(e), "error");
      await refresh();
    },
  });
  return (
    <>
      <PageHeader
        eyebrow="فصل قيد التخطيط"
        title="المخطط الدراسي"
        description="مسودات محفوظة في حسابك. أنشئ أكثر من خيار، وراجع المتطلبات والساعات قبل اتخاذ قرارك."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus size={17} />
            مسودة جديدة
          </Button>
        }
      />
      <Notice>
        المسودة مساحة للمراجعة وليست تسجيلًا جامعيًا. تغيير التخصص أو الخطة يحافظ على
        المسودات القديمة في خطتها الأصلية.
      </Notice>
      {drafts.error ? (
        <ErrorState error={drafts.error} retry={() => void drafts.refetch()} />
      ) : drafts.isPending ? (
        <Skeleton />
      ) : drafts.data.length ? (
        <div className="planner-grid">
          {drafts.data.map((p) => (
            <article className="surface plan-card" key={p.id}>
              <div className="section-heading">
                <span className="course-symbol">
                  <CalendarDays size={22} />
                </span>
                <Badge>مسودة محفوظة</Badge>
              </div>
              <h2>{p.name}</h2>
              <p>
                {p.major_name_ar} · الخطة {number(p.plan_number)}
              </p>
              <div className="plan-card-meta">
                <span>{number(p.course_count)} مساق</span>
                <span>{modeLabel(p.study_mode)}</span>
                <span>
                  {p.academic_term_id
                    ? (terms.data?.find((t) => t.id === p.academic_term_id)
                        ?.semester_name_ar ?? "فصل محفوظ")
                    : "دون فصل محدد"}
                </span>
              </div>
              <footer>
                <Link className="btn btn-secondary" to={`/app/planner/${p.id}`}>
                  فتح وتعديل
                  <ArrowLeft size={16} />
                </Link>
                <button
                  className="icon-btn remove-btn"
                  aria-label={`حذف المسودة ${p.name}`}
                  disabled={remove.isPending}
                  onClick={() => setDeleting(p)}
                >
                  <Trash2 size={18} />
                </button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="ابدأ بأول مسودة"
          description="اختر مساقات للمراجعة واحفظها، ثم عد إليها في أي وقت."
          action={
            <Button onClick={() => setCreating(true)}>
              <Plus size={17} />
              إنشاء مسودة
            </Button>
          }
        />
      )}
      {creating && (
        <Modal
          title="إنشاء مسودة فصل"
          onClose={() => {
            if (!create.isPending) setCreating(false);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <Input
              label="اسم المسودة"
              maxLength={120}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <Select
              label="الفصل الأكاديمي"
              value={term}
              disabled={terms.isPending || !!terms.error}
              onChange={(e) => setTerm(e.target.value)}
            >
              <TermOptions terms={terms.data ?? []} />
            </Select>
            {terms.error ? (
              <ErrorState error={terms.error} retry={() => void terms.refetch()} />
            ) : (
              !terms.isPending &&
              !terms.data?.length && (
                <p className="helper">
                  لم تُسجل فصول أكاديمية فعلية بعد. يمكنك حفظ المسودة دون فصل، وستظل حالة
                  الطرح غير مؤكدة.
                </p>
              )
            )}
            <Select
              label="نمط الدراسة للمسودة"
              value={mode}
              onChange={(e) => setMode(e.target.value as StudyMode | "")}
            >
              <option value="">حسب تفضيلات ملفي</option>
              <StudyOptions />
            </Select>
            <p className="helper">
              سترتبط المسودة بخطتك الحالية. الحد المفضل للساعات يؤخذ من ملفك ويُراجع عند كل
              تقييم.
            </p>
            <Button type="submit" busy={create.isPending}>
              إنشاء وحفظ المسودة
              <Save size={17} />
            </Button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Confirm
          title="حذف المسودة؟"
          description={`سيُحذف «${deleting.name}» ومساقاتها المختارة. لن تتأثر خطتك الأكاديمية أو إنجازاتك.`}
          busy={remove.isPending}
          onConfirm={() => remove.mutate(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
