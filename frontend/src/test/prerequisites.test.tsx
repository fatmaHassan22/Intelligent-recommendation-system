import { it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CourseDetails } from "../features/academic/CourseDetails";
import type { PrerequisiteEvaluation } from "../shared/api/types";
// Test-only fixtures; no academic records or live API responses are modified.
function show(evaluation: Partial<PrerequisiteEvaluation>) {
  const client = new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });
  client.setQueryData(["student", "profile"], { curriculum_plan_id: "test-plan" });
  client.setQueryData(["student", "completed"], []);
  client.setQueryData(["catalog", "detail", "test-plan", "TEST"], {
    course_code: "TEST",
    name_ar: "مساق اختبار",
    credit_hours: null,
    level: null,
    requirement_type: "UNVERIFIED",
    prerequisites: { operator: "AND", groups: [] },
    typical_semesters: { status: "UNKNOWN", records: [] },
    live_offerings: { status: "UNRECORDED", records: [] },
  });
  client.setQueryData(["student", "prerequisite", "test-plan", "TEST"], {
    operator: "AND",
    is_official_eligibility_decision: false,
    satisfied_prerequisites: [],
    missing_prerequisite_groups: [],
    ...evaluation,
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/test/TEST"]}>
        <Routes>
          <Route path="/test/:courseCode" element={<CourseDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
it("renders OR alternatives and AND groups using the server result", () => {
  show({
    satisfied: false,
    is_unverified: false,
    groups: [
      {
        group_number: 1,
        operator: "OR",
        verification_status: "VERIFIED_USER_SOURCE",
        courses: ["A1", "A2"],
        satisfied: true,
        completed_alternatives: ["A1"],
      },
      {
        group_number: 2,
        operator: "OR",
        verification_status: "VERIFIED_USER_SOURCE",
        courses: ["B1"],
        satisfied: false,
        completed_alternatives: [],
      },
    ],
  });
  expect(screen.getByText("أو")).toBeTruthy();
  expect(screen.getByText("و · يجب استيفاء البند التالي أيضًا")).toBeTruthy();
  expect(screen.getByText("متطلبات غير مستوفاة")).toBeTruthy();
  expect(screen.getByText("A2")).toBeTruthy();
});
it("never interprets unverified empty requirements as no prerequisite", () => {
  show({ satisfied: null, is_unverified: true, groups: [] });
  expect(screen.getByText("المعلومات غير متحققة")).toBeTruthy();
  expect(screen.queryByText("لا يوجد متطلب سابق مسجل")).toBeNull();
  expect(screen.getByText(/لا يعني ذلك عدم وجود متطلب/)).toBeTruthy();
});
it("displays explicit NONE separately from missing academic data", () => {
  show({ satisfied: true, is_unverified: false, groups: [] });
  expect(screen.getByText("لا يوجد متطلب سابق مسجل")).toBeTruthy();
  expect(screen.getAllByText("غير معروف").length).toBe(2);
  expect(screen.getByText("الفصل المعتاد لهذا المساق غير معروف.")).toBeTruthy();
});
