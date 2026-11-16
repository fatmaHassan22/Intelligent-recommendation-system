import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserRound, ShieldCheck, Save } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import type {
  Profile as StudentProfile,
  ProfileUpdate,
  StudyMode,
} from "../../shared/api/types";
import { useMajors, usePlans, useRefreshAcademic } from "../../shared/hooks/academic";
import {
  Badge,
  Button,
  Confirm,
  ErrorState,
  Input,
  Notice,
  Select,
  useToast,
} from "../../shared/ui";

export function ProfileForm({ profile }: { profile: StudentProfile }) {
  const makeData = (): ProfileUpdate => ({
    full_name: profile.full_name,
    major_id: String(profile.major_id),
    curriculum_plan_id: String(profile.curriculum_plan_id),
    university_student_number: profile.university_student_number,
    max_semester_credit_hours: profile.max_semester_credit_hours,
    preferred_study_mode: profile.preferred_study_mode,
    career_interest: profile.career_interest,
  });
  const [data, setData] = useState<ProfileUpdate>(makeData),
    [pending, setPending] = useState<ProfileUpdate | null>(null),
    [localError, setLocalError] = useState("");
  const majors = useMajors(),
    plans = usePlans(String(data.major_id ?? "")),
    refresh = useRefreshAcademic(),
    toast = useToast(),
    client = useQueryClient();
  useEffect(() => {
    setData(makeData());
  }, [profile]);
  const update = useMutation({
    mutationFn: (body: ProfileUpdate) => api.mutate("/students/me", "PATCH", body),
    onSuccess: async () => {
      await Promise.all([refresh(), client.invalidateQueries({ queryKey: ["auth"] })]);
      setPending(null);
      toast("تم حفظ ملفك الأكاديمي.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const set = <K extends keyof ProfileUpdate>(key: K, value: ProfileUpdate[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setLocalError("");
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!data.major_id || !data.curriculum_plan_id) {
      setLocalError("اختر تخصصًا وخطة متطابقين.");
      return;
    }
    if (String(data.curriculum_plan_id) !== String(profile.curriculum_plan_id)) {
      setPending({ ...data });
    } else update.mutate(data);
  };
  return (
    <>
      <form onSubmit={save}>
        <section className="surface">
          <div className="section-heading">
            <h2>معلوماتك الشخصية</h2>
            <UserRound size={21} />
          </div>
          <div className="form-grid">
            <Input
              label="الاسم الكامل"
              required
              maxLength={255}
              autoComplete="name"
              value={data.full_name ?? ""}
              onChange={(e) => set("full_name", e.target.value)}
            />
            <Input
              label="البريد الإلكتروني"
              type="email"
              dir="ltr"
              value={profile.email}
              readOnly
              hint="تغيير البريد غير متاح حاليًا."
            />
            <Input
              label="الرقم الجامعي (اختياري)"
              maxLength={64}
              value={data.university_student_number ?? ""}
              onChange={(e) =>
                set("university_student_number", e.target.value.trim() || null)
              }
            />
            <Input
              label="تاريخ إنشاء الحساب"
              value={new Date(profile.created_at).toLocaleDateString("ar")}
              readOnly
            />
          </div>
        </section>
        <section className="surface">
          <div className="section-heading">
            <h2>التخصص والخطة</h2>
            <Badge tone="teal">من بيانات الجامعة المسجلة</Badge>
          </div>
          <div className="form-grid">
            <Select
              label="التخصص"
              required
              value={String(data.major_id ?? "")}
              disabled={majors.isPending}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  major_id: e.target.value,
                  curriculum_plan_id: "",
                }))
              }
            >
              <option value="">اختر التخصص</option>
              {majors.data?.map((m) => (
                <option value={String(m.id)} key={m.id}>
                  {m.name_ar}
                </option>
              ))}
            </Select>
            <Select
              label="الخطة الدراسية"
              required
              value={String(data.curriculum_plan_id ?? "")}
              disabled={plans.isPending || !data.major_id}
              onChange={(e) => set("curriculum_plan_id", e.target.value)}
            >
              <option value="">اختر الخطة</option>
              {plans.data?.map((p) => (
                <option value={String(p.id)} key={p.id}>
                  الخطة {p.plan_number}
                </option>
              ))}
            </Select>
          </div>
          {majors.error && (
            <ErrorState error={majors.error} retry={() => void majors.refetch()} />
          )}{" "}
          {plans.error && (
            <ErrorState error={plans.error} retry={() => void plans.refetch()} />
          )}
          <Notice>
            عند تغيير الخطة، تبقى المساقات المنجزة مرتبطة بخطتها الأصلية. لا تُنقل تلقائيًا،
            وستظهر مجددًا إذا العودة إلى تلك الخطة.
          </Notice>
        </section>
        <section className="surface">
          <div className="section-heading">
            <h2>تفضيلات الدراسة</h2>
            <small>تفضيلات شخصية، وليست قواعد أكاديمية</small>
          </div>
          <div className="form-grid">
            <Input
              label="الحد الأقصى المفضل لساعات الفصل"
              type="number"
              required
              min={1}
              max={65535}
              value={data.max_semester_credit_hours || ""}
              onChange={(e) => set("max_semester_credit_hours", Number(e.target.value))}
            />
            <Select
              label="نمط الدراسة"
              value={data.preferred_study_mode}
              onChange={(e) => set("preferred_study_mode", e.target.value as StudyMode)}
            >
              <option value="LIGHT">خفيف</option>
              <option value="BALANCED">متوازن</option>
              <option value="FAST_GRADUATION">تخرج أسرع</option>
            </Select>
            <Input
              label="الاهتمام المهني (اختياري)"
              maxLength={255}
              value={data.career_interest ?? ""}
              onChange={(e) => set("career_interest", e.target.value.trim() || null)}
            />
          </div>
          <p className="helper">
            تُستخدم هذه التفضيلات للتوصيات والمخطط، دون اعتبارها قواعد جامعية.
          </p>
        </section>
        {(localError || update.error) && (
          <p className="form-error" role="alert">
            {localError || errorMessage(update.error)}
          </p>
        )}
        <div className="save-bar">
          <span>
            <ShieldCheck size={17} /> بياناتك خاصة بحسابك
          </span>
          <Button type="submit" busy={update.isPending}>
            <Save size={17} /> حفظ التغييرات
          </Button>
        </div>
      </form>
      {pending && (
        <Confirm
          title="تأكيد تغيير الخطة الدراسية"
          description="ستنتقل واجهتك إلى الخطة المختارة، لكن إنجازاتك السابقة ستبقى في الخطة القديمة. لن تُحذف أو تُنقل. هل تؤكدين التغيير؟"
          busy={update.isPending}
          onClose={() => setPending(null)}
          onConfirm={() => update.mutate({ ...pending, confirm_plan_change: true })}
        />
      )}
    </>
  );
}
