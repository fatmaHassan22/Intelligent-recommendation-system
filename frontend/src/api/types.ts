export type ID = string | number;
export type Role = 'STUDENT' | 'ADMIN';
export type Requirement = 'REQUIRED' | 'ELECTIVE' | 'UNVERIFIED';
export type StudyMode = 'LIGHT' | 'BALANCED' | 'FAST_GRADUATION';
export interface User { id: ID; full_name: string; email: string; role: Role; created_at: string }
export interface Major { id: ID; code: string; name_ar: string; name_en: string | null; is_active: number }
export interface Plan { id: ID; major_id: ID; plan_number: number; total_credit_hours: number | null; verification_status: string }
export interface Profile extends User { university_student_number: string | null; curriculum_plan_id: ID; major_id: ID; max_semester_credit_hours: number; preferred_study_mode: StudyMode; career_interest: string | null }
export interface Course { id?: ID; course_code: string; name_ar: string; source_name_ar?: string; credit_hours: number | null; level: number | null; requirement_type: Requirement; prerequisite_status?: string; completed?: number; created_at?: string; declaration_status?: string }
export interface Group { group_number: number; operator: string; courses: string[]; verification_status: string; satisfied?: boolean; completed_alternatives?: string[]; missing_alternatives?: string[] }
export interface CourseDetail extends Course { prerequisites: { operator: 'AND'; groups: Group[] }; typical_semesters: { status: string; records: { code: string; name_ar: string; verification_status: string; source_reference: string }[] }; live_offerings: { status: string; records: { academic_year: string; semester: string; is_offered: number }[] } }
export interface PrerequisiteEvaluation { satisfied: boolean | null; is_unverified: boolean; operator: string; groups: Group[]; satisfied_prerequisites: string[]; missing_prerequisite_groups: { group_number: number; operator: string; alternatives: string[] }[]; is_official_eligibility_decision: false }
export interface ElectiveGroup { id: ID; code: string; name_ar?: string; required_credit_hours: number | null; required_course_count: number | null; courses?: Course[]; known_credit_hours?: number | null; unknown_credit_course_count?: number; is_complete?: boolean; completed_course_count?: number }
export interface CreditSummary { known_credit_hours: number | null; unknown_credit_course_count: number; is_complete: boolean }
export interface Progress { curriculum_plan_id: ID; total_plan_credit_hours: number | null; total_known_curriculum_courses: number; completed_course_count: number; remaining_course_count: number; completed_required_courses: number; completed_elective_courses: number; completed_unverified_courses: number; known_completed_credit_hours: number | null; completed_credit_summary: CreditSummary; required_elective_hours: number | null; completed_elective_hours: number | null; known_completed_elective_hours: number; elective_groups: ElectiveGroup[]; completed_courses: Course[]; remaining_courses: Course[]; is_degree_audit_complete: boolean; degree_audit_limitations: string[]; completion_source: string; remaining_courses_are_not_all_mandatory: boolean; elective_group_totals_may_overlap: boolean }
export interface List<T> { data: T[] }
export interface Result<T> { data: T }
export interface CoursePage extends List<Course> { pagination: { page: number; limit: number; total: number } }

export interface Registration {
    full_name: string;
    email: string;
    password: string;
    major_id: string;
    curriculum_plan_id: string;
    university_student_number: string | null;
    max_semester_credit_hours: number;
    preferred_study_mode: StudyMode;
    career_interest: string | null
}

export type ProfileUpdate = Partial<Omit<Registration, 'email' | 'password'>> & { confirm_plan_change?: boolean };
