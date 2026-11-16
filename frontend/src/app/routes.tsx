import { Suspense, lazy } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { navigation } from "../config/navigation";
import { Skeleton } from "../shared/ui";
import { lazyNamed } from "./lazy";

/**
 * كل الصفحات تُحمَّل عند الطلب (code splitting).
 * لإضافة صفحة جديدة: أضف سطر lazyNamed هنا ثم <Route> تحتها.
 */
const Welcome = lazyNamed(() => import("../features/landing/Welcome"), "Welcome");
const Login = lazyNamed(() => import("../features/auth/Login"), "Login");
const Register = lazyNamed(() => import("../features/auth/Register"), "Register");
const ProtectedLayout = lazyNamed(
  () => import("./layout/ProtectedLayout"),
  "ProtectedLayout",
);

const Dashboard = lazyNamed(() => import("../features/academic/Dashboard"), "Dashboard");
const Curriculum = lazyNamed(
  () => import("../features/academic/Curriculum"),
  "Curriculum",
);
const CourseDetails = lazyNamed(
  () => import("../features/academic/CourseDetails"),
  "CourseDetails",
);
const Completed = lazyNamed(() => import("../features/academic/Completed"), "Completed");
const ProgressPage = lazyNamed(
  () => import("../features/academic/ProgressPage"),
  "ProgressPage",
);

const ProfilePage = lazyNamed(
  () => import("../features/profile/ProfilePage"),
  "ProfilePage",
);
const SettingsPage = lazyNamed(
  () => import("../features/profile/SettingsPage"),
  "SettingsPage",
);

const RecommendationsPage = lazyNamed(
  () => import("../features/planning/RecommendationsPage"),
  "RecommendationsPage",
);
const PlannerPage = lazyNamed(
  () => import("../features/planning/PlannerPage"),
  "PlannerPage",
);
const DraftPage = lazyNamed(() => import("../features/planning/DraftPage"), "DraftPage");

const StreakPage = lazyNamed(
  () => import("../features/engagement/StreakPage"),
  "StreakPage",
);
const AvatarPage = lazyNamed(
  () => import("../features/engagement/AvatarPage"),
  "AvatarPage",
);
const AchievementsPage = lazyNamed(
  () => import("../features/engagement/AchievementsPage"),
  "AchievementsPage",
);

const TasksPage = lazyNamed(
  () => import("../features/productivity/TasksPage"),
  "TasksPage",
);
const CalendarPage = lazyNamed(
  () => import("../features/productivity/CalendarPage"),
  "CalendarPage",
);
const PomodoroPage = lazyNamed(
  () => import("../features/productivity/PomodoroPage"),
  "PomodoroPage",
);
const NotificationsPage = lazyNamed(
  () => import("../features/productivity/Notifications"),
  "NotificationsPage",
);

const AssistantPage = lazyNamed(
  () => import("../features/integrations/AssistantPage"),
  "AssistantPage",
);
const MoodlePage = lazyNamed(
  () => import("../features/integrations/Moodle"),
  "MoodlePage",
);

const ThemePage = lazyNamed(() => import("../features/theme/theme"), "ThemePage");
// معرض المكونات: يُحذف تلقائياً من نسخة الإنتاج (import.meta.env.DEV = false).
const UiKit = lazy(() => import("../features/dev/UiKit"));
const FuturePage = lazyNamed(() => import("../features/future/FuturePage"), "FuturePage");

const FullScreenLoader = () => (
  <div className="full-state">
    <Skeleton />
  </div>
);

function NotFound() {
  return (
    <div className="full-state">
      <h1>الصفحة غير موجودة</h1>
      <Link to="/">العودة للرئيسية</Link>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/app" element={<ProtectedLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<ProfilePage />} />
          {import.meta.env.DEV && <Route path="_ui" element={<UiKit />} />}
          <Route path="theme" element={<ThemePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="curriculum/:courseCode" element={<CourseDetails />} />
          <Route path="completed" element={<Completed />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="planner/:planId" element={<DraftPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:taskId" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="streaks" element={<StreakPage />} />
          <Route path="avatar" element={<AvatarPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="moodle" element={<MoodlePage />} />
          {navigation
            .filter((item) => item.future)
            .map((item) => (
              <Route key={item.path} path={item.path} element={<FuturePage />} />
            ))}
          <Route path="*" element={<FuturePage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
