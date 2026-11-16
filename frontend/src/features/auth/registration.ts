import type { Registration } from "../../shared/api/types";

export const titles = [
  "معلوماتك الشخصية",
  "بياناتك الأكاديمية",
  "تفضيلات الدراسة",
  "مراجعة بياناتك",
];

export const initial: Registration = {
  full_name: "",
  email: "",
  password: "",
  major_id: "",
  curriculum_plan_id: "",
  university_student_number: null,
  max_semester_credit_hours: 18,
  preferred_study_mode: "BALANCED",
  career_interest: null,
};

export function validateStep(step: number, data: Registration): string | null {
  if (step === 0) {
    if (!data.full_name.trim()) return "أدخل اسمك الكامل.";
    if (!/^[\x21-\x7e]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
      return "أدخل بريدًا إلكترونيًا صالحًا.";
    if (data.password.length < 12 || new TextEncoder().encode(data.password).length > 72)
      return "كلمة المرور يجب أن تكون 12 حرفًا على الأقل وألا تتجاوز 72 بايت.";
  }
  if (step === 1 && (!data.major_id || !data.curriculum_plan_id))
    return "اختر تخصصًا وخطة من القائمة.";

  if (
    step === 2 &&
    (!Number.isInteger(data.max_semester_credit_hours) ||
      data.max_semester_credit_hours <= 0 ||
      data.max_semester_credit_hours > 65535)
  )
    return "أدخل عدد ساعات صحيحًا موجبًا.";
  return null;
}
