import {
  Home,
  UserRound,
  BookOpen,
  CheckCheck,
  ChartNoAxesCombined,
  Sparkles,
  Route,
  ListTodo,
  CalendarDays,
  Timer,
  Bell,
  MessagesSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

/** المسار الأساسي لمساحة الطالب. */
export const APP_BASE = "/app";

export interface NavItem {
  /** المسار النسبي تحت APP_BASE. نص فارغ = الصفحة الرئيسية. */
  readonly path: string;
  readonly label: string;
  readonly icon: LucideIcon;
  /** يرسم فاصلاً قبل هذا العنصر في القائمة الجانبية. */
  readonly divider?: boolean;
  /** صفحة غير جاهزة بعد (تُعرض عبر FuturePage). */
  readonly future?: boolean;
}

/** يبني المسار الكامل من مسار نسبي: appPath("tasks") → "/app/tasks". */
export const appPath = (path: string) => (path ? `${APP_BASE}/${path}` : APP_BASE);

export const navigation: readonly NavItem[] = [
  { path: "", label: "الرئيسية", icon: Home },
  { path: "profile", label: "ملفي الأكاديمي", icon: UserRound },
  { path: "curriculum", label: "خطتي الدراسية", icon: BookOpen },
  { path: "completed", label: "المواد المنجزة", icon: CheckCheck },
  { path: "progress", label: "التقدم الأكاديمي", icon: ChartNoAxesCombined },
  {
    path: "recommendations",
    label: "توصية المواد",
    icon: Sparkles,
    divider: true,
  },
  { path: "planner", label: "المخطط الدراسي", icon: Route },
  { path: "tasks", label: "المهام", icon: ListTodo },
  { path: "calendar", label: "التقويم", icon: CalendarDays },
  { path: "pomodoro", label: "بومودورو", icon: Timer },
  { path: "notifications", label: "الإشعارات", icon: Bell },
  { path: "streaks", label: "الاستمرارية", icon: Sparkles },
  { path: "avatar", label: "الأفاتار", icon: UserRound },
  { path: "achievements", label: "الإنجازات", icon: ChartNoAxesCombined },
  { path: "assistant", label: "المساعد الدراسي", icon: MessagesSquare },
  { path: "moodle", label: "Moodle", icon: BookOpen },
  { path: "settings", label: "الإعدادات", icon: Settings },
];
