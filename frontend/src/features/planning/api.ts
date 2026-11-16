import type { Course, Group, StudyMode } from "../../shared/api/types";
export type Category = "SUITABLE" | "BLOCKED" | "UNVERIFIED" | "NOT_OFFERED";
export interface CreditSummary {
  known_credit_hours: number;
  unknown_credit_course_count: number;
  total_credit_hours: number | null;
  configured_max_credit_hours: number;
  remaining_credit_capacity: number | null;
  known_credit_capacity: number;
  exceeds_configured_max: boolean;
  is_total_complete: boolean;
  is_official_registration_limit: false;
}
export interface Recommendation extends Course {
  eligibility_status: "SUITABLE" | "BLOCKED" | "UNVERIFIED";
  category: Category;
  offering_status:
    "NOT_RECORDED" | "UNVERIFIED" | "CONFIRMED_OFFERED" | "CONFIRMED_NOT_OFFERED";
  classification_verified: boolean;
  already_completed: boolean;
  already_selected: boolean;
  rank: number | null;
  unlock_count: number;
  workload_score: number | null;
  difficulty_level: string | null;
  prerequisites: {
    satisfied: boolean | null;
    is_unverified: boolean;
    requires_academic_review?: boolean;
    groups: Group[];
  };
  reasons: { code: string; text_ar: string }[];
  ranking: {
    score: number;
    factors: { code: string; label_ar: string; points: number; value: number }[];
  };
}
export interface DraftValidation {
  credit_summary: CreditSummary;
  courses: DraftCourse[];
  academically_valid: boolean;
  fully_validated: boolean;
  workload: {
    known_score: number;
    unknown_course_count: number;
    total_score: number | null;
  };
  warnings: string[];
  is_official_registration_approval: false;
}
export type DraftCourse = Omit<Recommendation, "rank" | "unlock_count" | "ranking">;
export interface Draft {
  id: string;
  curriculum_plan_id: string;
  academic_term_id: string | null;
  name: string;
  study_mode: StudyMode;
  revision: number;
  major_code: string;
  major_name_ar: string;
  plan_number: number;
  created_at: string;
  updated_at: string;
  course_count?: number;
  validation?: DraftValidation;
  is_current_curriculum_plan?: boolean;
  status?: "DRAFT";
}
export interface AcademicTerm {
  id: string;
  academic_year: string;
  semester_code: string;
  semester_name_ar: string;
}
export interface RecommendationsResponse {
  data: Recommendation[];
  pagination: { page: number; limit: number; total: number };
  counts: Record<Category, number>;
  credit_summary: CreditSummary;
  suggested_course_codes: string[];
  study_mode: StudyMode;
  curriculum_plan_id: string;
  academic_term_id: string | null;
  draft_id: string | null;
  is_current_curriculum_plan: boolean;
  preference_target_credit_hours: number;
  preference_target_course_count: number;
  limitations: string[];
}
