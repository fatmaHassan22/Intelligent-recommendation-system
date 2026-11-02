import React, { Component, type ReactNode } from 'react';

import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import '@fontsource-variable/noto-sans-arabic';
import './styles.css';
import './productivity/styles.css';
import './engagement/styles.css';
import './integrations/styles.css';
const AssistantPage = React.lazy(() => import('./integrations/Assistant').then(m => ({ default: m.AssistantPage })));
const MoodlePage = React.lazy(() => import('./integrations/Moodle').then(m => ({ default: m.MoodlePage })));
import { StreakPage, AvatarPage, AchievementsPage } from './engagement/Engagement';
import { AuthProvider, queryClient } from './state';
import { ToastProvider } from './components/ui';
import { ProtectedLayout, navigation } from './components/Layout';
import { Welcome, Login, Register } from './pages/Auth';
import { Dashboard, Curriculum, CourseDetails, Completed, ProgressPage } from './pages/Academic';
import { ProfilePage, SettingsPage } from './pages/Profile';
import { FuturePage } from './pages/Future';
import { RecommendationsPage, PlannerPage, DraftPage } from './pages/Planning';
import { TasksPage } from './productivity/Tasks';
import { CalendarPage } from './productivity/Calendar';
import { PomodoroPage } from './productivity/Pomodoro';
import { NotificationsPage } from './productivity/Notifications';
class ErrorBoundary extends Component<{ children: ReactNode },
    { failed: boolean }> {
    state = { failed: false }; static getDerivedStateFromError() {
        return { failed: true };
    } render() {
        return this.state.failed ?
            <div className="full-state" role="alert">
                <h1>تعذر عرض الصفحة</h1>
                <p>حاولي إعادة تحميل التطبيق. بياناتك محفوظة في الخادم.</p>
                <button className="btn btn-primary" onClick={() => location.reload()}
                >إعادة التحميل
                </button>
            </div> : this.props.children;
    }
}
export function App() {
    return <ErrorBoundary><QueryClientProvider
        client={queryClient}>
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Welcome />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/app" element={<ProtectedLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="profile" element={<ProfilePage />} />
                            <Route path="curriculum" element={<Curriculum />} />
                            <Route path="curriculum/:courseCode" element={<CourseDetails />} />
                            <Route path="completed" element={<Completed />} />
                            <Route path="progress" element={<ProgressPage />} />
                            <Route path="streaks" element={<StreakPage />} />
                            <Route path="avatar" element={<AvatarPage />} />
                            <Route path="achievements" element={<AchievementsPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="recommendations" element={<RecommendationsPage />} />
                            <Route path="planner" element={<PlannerPage />} />
                            <Route path="planner/:planId" element={<DraftPage />} />
                            <Route path="tasks" element={<TasksPage />} />
                            <Route path="tasks/:taskId" element={<TasksPage />} />
                            <Route path="calendar" element={<CalendarPage />} />
                            <Route path="pomodoro" element={<PomodoroPage />} />
                            <Route path="assistant" element={<React.Suspense fallback={<div role="status">جارٍ تحميل المساعد…</div>}>
                                <AssistantPage />
                            </React.Suspense>} />
                            <Route path="moodle" element={<React.Suspense fallback={<div role="status">جارٍ تحميل Moodle…</div>}>
                                <MoodlePage />
                            </React.Suspense>} />
                            <Route path="notifications" element={<NotificationsPage />} />
                            {navigation.filter(n => n.future).map(n => <Route path={n.path} element={<FuturePage />}
                                key={n.path} />)}<Route path="*" element={<FuturePage />} /></Route>
                        <Route path="*" element={<div className="full-state">
                            <h1>الصفحة غير موجودة</h1>
                            <Link to="/">العودة للرئيسية</Link>
                        </div>} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>;
}


