import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { validateStep } from "../features/auth/registration";
import { number, Input } from "../shared/ui";
import type { Registration } from "../shared/api/types";
const data: Registration = {
  full_name: "اختبار",
  email: "qa@example.test",
  password: "twelve-characters!",
  major_id: "1",
  curriculum_plan_id: "1",
  max_semester_credit_hours: 18,
  preferred_study_mode: "BALANCED",
  university_student_number: null,
  career_interest: null,
};
it("rejects short and UTF8-oversize passwords", () => {
  expect(validateStep(0, { ...data, password: "short" })).not.toBeNull();
  expect(validateStep(0, { ...data, password: "ع".repeat(37) })).not.toBeNull();
  expect(validateStep(0, data)).toBeNull();
});
it("requires actual selected plan and a positive integer preference", () => {
  expect(validateStep(1, { ...data, curriculum_plan_id: "" })).not.toBeNull();
  for (const n of [0, -1, 1.5, 65536])
    expect(validateStep(2, { ...data, max_semester_credit_hours: n })).not.toBeNull();
});
it("keeps unknown numeric data distinct from zero", () => {
  expect(number(null)).toBe("غير معروف");
  expect(number(undefined)).toBe("غير معروف");
  expect(number(0)).not.toBe("غير معروف");
});
it("associates Arabic labels and help with their input", () => {
  render(<Input label="اختبار الحقل" hint="وصف الحقل" />);
  const input = screen.getByLabelText("اختبار الحقل");
  expect(input.getAttribute("aria-describedby")).toBeTruthy();
  expect(
    document.getElementById(input.getAttribute("aria-describedby")!)?.textContent,
  ).toBe("وصف الحقل");
});
