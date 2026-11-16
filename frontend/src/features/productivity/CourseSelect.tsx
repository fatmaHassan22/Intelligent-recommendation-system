import { Select } from "../../shared/ui";
import { useCourses } from "./hooks";

export function CourseSelect({
  value,
  onChange,
  previous,
}: {
  value: string;
  onChange: (s: string) => void;
  previous?: { course_code: string | null; course_name: string | null };
}) {
  const courses = useCourses();
  return (
    <Select
      label="المساق المرتبط (اختياري)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={courses.isPending || !!courses.error}
    >
      <option value="">دون مساق</option>
      {previous?.course_code &&
        !courses.data?.data.some((c) => c.course_code === previous.course_code) && (
          <option value={previous.course_code}>
            {previous.course_code} · {previous.course_name} (الخطة السابقة)
          </option>
        )}
      {courses.data?.data.map((c) => (
        <option key={c.course_code} value={c.course_code}>
          {c.course_code} · {c.name_ar}
        </option>
      ))}
    </Select>
  );
}
