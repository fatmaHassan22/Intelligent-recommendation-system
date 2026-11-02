import type { MoodleItem } from '../integrations/types';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export interface Task { id: string; title: string; description: string | null; priority: Priority; status: TaskStatus; due_date: string | null; due_time: string | null; due_at: string | null; timezone: string; completed_at: string | null; course_code: string | null; course_name: string | null; revision: number; created_at: string; updated_at: string; is_overdue: boolean }
export interface PersonalEvent { id: string; title: string; description: string | null; start_at: string; end_at: string; all_day: boolean; timezone: string; course_code: string | null; course_name: string | null; revision: number }
export interface TaskPage { data: Task[]; pagination: { page: number; limit: number; total: number }; server_now: string }
export interface CalendarData { moodle_events?: MoodleItem[]; tasks: Task[]; events: PersonalEvent[]; from: string; to: string }
export type TimerMode = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';
export interface FocusSession { id: string; mode: TimerMode; state: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'; duration_ms: number; remaining_ms: number; started_at: string; ends_at: string | null; completed_at: string | null; task_id: string | null; task_title?: string | null; course_id: string | null; course_code?: string | null; course_name?: string | null; revision: number }
export interface ActiveResponse { data: FocusSession | null; server_now: string; suggested_break_mode?: TimerMode }
export interface PomodoroSettings { focus_minutes: number; short_break_minutes: number; long_break_minutes: number; long_break_after: number }
export interface FocusStats { timezone: string; today_focus_minutes: number; today_completed_sessions: number; weekly_focus_minutes: number; weekly_completed_sessions: number; total_completed_focus_sessions: number; total_focus_minutes: number; daily: { date: string; completed_sessions: number; focus_minutes: number }[] }
export interface ProductivitySummary { today_tasks: Task[]; upcoming_tasks: Task[]; overdue_count: number; completed_today: number; focus: FocusStats; timezone: string }
export interface Notification { id: string; type: string; title: string; message: string; created_at: string; read_at: string | null; href: string | null; task_id: string | null; event_id: string | null; session_id: string | null }
export interface NotificationPage { data: Notification[]; unread_count: number; pagination: { page: number; limit: number; total: number } }
export interface NotificationPreferences { timezone: string; configured?: boolean; task_upcoming: boolean; task_overdue: boolean; event_reminders: boolean; pomodoro_completion: boolean; general_reminders: boolean; task_reminder_minutes: number; event_reminder_minutes: number }
export interface ProductivityCourse { course_code: string; name_ar: string }
