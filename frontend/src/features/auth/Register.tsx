import { ReactNode, useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../shared/api/client";
import type { Registration, StudyMode, User } from "../../shared/api/types";
import { useAuth } from "./AuthProvider";
import { useMajors, usePlans } from "../../shared/hooks/academic";
import { Button, Input, Select, ErrorState, modeLabel } from "../../shared/ui";
import { AuthFrame } from "./AuthFrame";
import { SwitchLink } from "./SwitchLink";
import { Stepper } from "./Stepper";
import { PasswordStrength } from "./PasswordStrength";
import { titles, initial, validateStep } from "./registration";

export function Register() {
  const auth = useAuth(),
    navigate = useNavigate(),
    majors = useMajors();

  const [step, setStep] = useState(0),
    [dir, setDir] = useState<"fwd" | "back">("fwd"),
    [data, setData] = useState<Registration>(initial),
    [error, setError] = useState<string | null>(null);

  const plans = usePlans(data.major_id);

  const prevStep = useRef(step);
  useEffect(() => {
    if (prevStep.current !== step) {
      prevStep.current = step;
      document.querySelector<HTMLElement>("[data-step-title]")?.focus();
    }
  }, [step]);

  const set = <K extends keyof Registration>(key: K, value: Registration[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setError(null);
  };

  const register = useMutation({
    mutationFn: () =>
      api.mutate<{
        user: User;
        csrf_token: string;
      }>("/auth/register", "POST", {
        ...data,
        full_name: data.full_name.trim(),
        email: data.email.trim(),
      }),
    onSuccess: (r) => {
      setData(initial);
      auth.accept(r.user);
      navigate("/app", { replace: true });
    },
  });

  if (auth.user) return <Navigate to="/app" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const invalid = validateStep(step, data);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (step < 3) {
      setDir("fwd");
      setStep(step + 1);
      setError(null);
    } else register.mutate();
  };

  const message = error ?? (register.error ? errorMessage(register.error) : null);

  return (
    <AuthFrame title="ابدأ مسارك" subtitle="أربع خطوات قصيرة، وحساب يتبع خطتك أنت.">
      <Stepper steps={titles} current={step} />

      <form onSubmit={submit}>
        {/* key={step} يعيد تشغيل حركة الدخول عند كل خطوة */}
        <div
          key={step}
          className={`auth-stagger ${dir === "back" ? "animate-step-back" : "animate-step-in"}`}
        >
          <h2
            data-step-title
            tabIndex={-1}
            className="text-[19px] font-semibold outline-none"
          >
            {titles[step]}
          </h2>

          {step === 0 && (
            <>
              <Input
                label="الاسم الكامل"
                autoComplete="name"
                required
                maxLength={255}
                value={data.full_name}
                onChange={(e) => set("full_name", e.target.value)}
              />
              <Input
                label="البريد الإلكتروني"
                type="email"
                dir="ltr"
                autoComplete="email"
                required
                maxLength={254}
                value={data.email}
                onChange={(e) => set("email", e.target.value)}
              />
              <Input
                label="كلمة المرور"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={data.password}
                onChange={(e) => set("password", e.target.value)}
                hint="12 حرفًا على الأقل. لا تحفظ المنصة كلمة المرور بصيغتها الأصلية."
              />
              <PasswordStrength value={data.password} />
            </>
          )}

          {step === 1 && (
            <>
              {majors.error ? (
                <ErrorState error={majors.error} retry={() => void majors.refetch()} />
              ) : (
                <Select
                  label="التخصص"
                  required
                  value={data.major_id}
                  disabled={majors.isPending}
                  onChange={(e) =>
                    setData((d) => ({
                      ...d,
                      major_id: e.target.value,
                      curriculum_plan_id: "",
                    }))
                  }
                >
                  <option value="">
                    {majors.isPending ? "جارٍ تحميل التخصصات…" : "اختر تخصصك"}
                  </option>
                  {majors.data?.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.name_ar}
                    </option>
                  ))}
                </Select>
              )}
              <Select
                label="الخطة الدراسية"
                required
                disabled={!data.major_id || plans.isPending}
                value={data.curriculum_plan_id}
                onChange={(e) => set("curriculum_plan_id", e.target.value)}
              >
                <option value="">اختر الخطة</option>
                {plans.data?.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    الخطة {p.plan_number}
                  </option>
                ))}
              </Select>
              {plans.error && (
                <ErrorState error={plans.error} retry={() => void plans.refetch()} />
              )}
              <Input
                label="الرقم الجامعي (اختياري)"
                maxLength={64}
                value={data.university_student_number ?? ""}
                onChange={(e) =>
                  set("university_student_number", e.target.value.trim() || null)
                }
              />
            </>
          )}

          {step === 2 && (
            <>
              <Input
                label="الحد الأقصى المفضل لساعات الفصل"
                type="number"
                min={1}
                max={65535}
                required
                value={data.max_semester_credit_hours || ""}
                onChange={(e) => set("max_semester_credit_hours", Number(e.target.value))}
                hint="تفضيل شخصي، وليس اعتمادًا للحد الأكاديمي المسموح."
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
              <p className="mt-3 text-xs leading-relaxed text-muted">
                نحتفظ بهذه التفضيلات. تُستخدم لتوصيات قائمة على قواعد واضحة، وليست قواعد
                تسجيل جامعية.
              </p>
            </>
          )}

          {step === 3 && (
            <>
              <dl className="mt-4 grid gap-2.5">
                {(
                  [
                    ["الاسم", data.full_name],
                    ["البريد", <span dir="ltr">{data.email}</span>],
                    [
                      "التخصص",
                      majors.data?.find((m) => String(m.id) === data.major_id)?.name_ar,
                    ],
                    [
                      "الخطة",
                      plans.data?.find((p) => String(p.id) === data.curriculum_plan_id)
                        ?.plan_number,
                    ],
                    ["الرقم الجامعي", data.university_student_number ?? "غير مدخل"],
                    ["الساعات المفضلة", data.max_semester_credit_hours],
                    ["نمط الدراسة", modeLabel(data.preferred_study_mode)],
                    ["الاهتمام المهني", data.career_interest ?? "غير محدد"],
                  ] as [string, ReactNode][]
                ).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 rounded-[14px] border border-line bg-[#f9fbfd] px-4 py-3.5 text-sm"
                  >
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                راجع بياناتك. يمكنك تعديل ملفك لاحقًا، مع تأكيد عند تغيير الخطة.
              </p>
            </>
          )}
        </div>

        {message && (
          <p
            key={message}
            role="alert"
            className="mt-4 animate-shake rounded-xl bg-[#fdecea] px-3.5 py-3 text-sm text-[#9a3412]"
          >
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" busy={register.isPending}>
            {step === 3 ? "إنشاء حسابي" : "التالي"}
            <ArrowLeft size={17} />
          </Button>
          {step > 0 && (
            <Button
              variant="secondary"
              type="button"
              disabled={register.isPending}
              onClick={() => {
                setDir("back");
                setStep(step - 1);
                setError(null);
              }}
            >
              السابق
            </Button>
          )}
        </div>
      </form>

      <SwitchLink text="لديك حساب؟" to="/login" label="تسجيل الدخول" />
    </AuthFrame>
  );
}
