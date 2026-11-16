import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DraftPage } from "../features/planning/DraftPage";
import { Evaluation } from "../features/planning/components";
import type { DraftCourse, DraftValidation } from "../features/planning/api";
// Isolated UI contract fixtures; production pages always use the real backend.
const course: DraftCourse = {
  course_code: "TEST",
  name_ar: "مساق اختبار",
  credit_hours: 3,
  level: null,
  requirement_type: "REQUIRED",
  eligibility_status: "SUITABLE",
  category: "SUITABLE",
  offering_status: "NOT_RECORDED",
  classification_verified: true,
  already_completed: false,
  already_selected: false,
  workload_score: null,
  difficulty_level: null,
  prerequisites: { satisfied: true, is_unverified: false, groups: [] },
  reasons: [{ code: "OFFERING_UNKNOWN", text_ar: "الطرح غير مؤكد." }],
};
it("renders saved course evaluations without recommendation-only ranking fields", () => {
  render(<Evaluation course={course} />);
  expect(screen.getByText("الطرح غير مؤكد.")).toBeTruthy();
  expect(screen.queryByText(/نقاط الترتيب/)).toBeNull();
});
function show(validation: DraftValidation) {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(["student", "draft", "123"], {
    id: "123",
    name: "مسودة اختبار",
    curriculum_plan_id: "1",
    academic_term_id: null,
    study_mode: "BALANCED",
    revision: 1,
    major_name_ar: "تخصص اختبار",
    plan_number: 4,
    is_current_curriculum_plan: true,
    validation,
  });
  client.setQueryData(["student", "academic-terms"], []);
  client.setQueryData(["student", "recommendations", "draft", "123", "", 1], {
    data: [],
    pagination: { page: 1, limit: 6, total: 0 },
    suggested_course_codes: [],
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/draft/123"]}>
        <Routes>
          <Route path="/draft/:planId" element={<DraftPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
const validation: DraftValidation = {
  credit_summary: {
    known_credit_hours: 3,
    unknown_credit_course_count: 0,
    total_credit_hours: 3,
    configured_max_credit_hours: 18,
    remaining_credit_capacity: 15,
    known_credit_capacity: 15,
    exceeds_configured_max: false,
    is_total_complete: true,
    is_official_registration_limit: false,
  },
  courses: [course],
  academically_valid: true,
  fully_validated: false,
  workload: { known_score: 0, unknown_course_count: 1, total_score: null },
  warnings: ["الطرح غير مؤكد."],
  is_official_registration_approval: false,
};
it("does not present an academically suitable draft as fully checked when offering is unknown", () => {
  show(validation);
  expect(screen.getByText("تحتاج مراجعة")).toBeTruthy();
  expect(screen.queryByText("الشروط المسجلة مستوفاة")).toBeNull();
  expect(screen.getByText(/لا يمثل موافقة جامعية/)).toBeTruthy();
});
it("distinguishes partial credits from an unknown total and capacity", () => {
  show({
    ...validation,
    academically_valid: false,
    credit_summary: {
      ...validation.credit_summary,
      unknown_credit_course_count: 1,
      is_total_complete: false,
      total_credit_hours: null,
      remaining_credit_capacity: null,
    },
    courses: [
      {
        ...course,
        credit_hours: null,
        category: "UNVERIFIED",
        eligibility_status: "UNVERIFIED",
      },
    ],
  });
  expect(screen.getByText("هذا الجزء المعروف فقط؛ الإجمالي غير مكتمل")).toBeTruthy();
  expect(screen.getAllByText("غير معروف").length).toBeGreaterThan(1);
});
