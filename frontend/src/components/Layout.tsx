import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { Home, UserRound, BookOpen, CheckCheck, ChartNoAxesCombined, Sparkles, Route, ListTodo, CalendarDays, Timer, Bell, MessagesSquare, Settings, LogOut, Menu, X, ChevronDown, PanelRightClose } from 'lucide-react';
import { useAuth } from '../state';
import { Logo } from '../pages/Auth';
import { Button, ErrorState, Skeleton, useToast } from './ui';
import { errorMessage } from '../api/client';
import { StudentAvatar, AchievementCelebration } from '../engagement/Engagement';
import { ProductivityHeader } from '../productivity/Pomodoro';
export const navigation: {
   path: string;
   label: string;
   icon: typeof Home;
   future?: boolean
}[] = [
      { path: '', label: 'الرئيسية', icon: Home },
      { path: 'profile', label: 'ملفي الأكاديمي', icon: UserRound },
      { path: 'curriculum', label: 'خطتي الدراسية', icon: BookOpen },
      { path: 'completed', label: 'المواد المنجزة', icon: CheckCheck },
      { path: 'progress', label: 'التقدم الأكاديمي', icon: ChartNoAxesCombined },
      { path: 'recommendations', label: 'توصية المواد', icon: Sparkles },
      { path: 'planner', label: 'المخطط الدراسي', icon: Route },
      { path: 'tasks', label: 'المهام', icon: ListTodo },
      { path: 'calendar', label: 'التقويم', icon: CalendarDays },
      { path: 'pomodoro', label: 'بومودورو', icon: Timer },
      { path: 'notifications', label: 'الإشعارات', icon: Bell },
      { path: 'streaks', label: 'الاستمرارية', icon: Sparkles },
      { path: 'avatar', label: 'الأفاتار', icon: UserRound },
      { path: 'achievements', label: 'الإنجازات', icon: ChartNoAxesCombined },
      { path: 'assistant', label: 'المساعد الدراسي', icon: MessagesSquare },
      { path: 'moodle', label: 'Moodle', icon: BookOpen },
      { path: 'settings', label: 'الإعدادات', icon: Settings }];

export function ProtectedLayout() {
   const auth = useAuth(),
      toast = useToast(),
      location = useLocation();
   const [mobile, setMobile] = useState(false),
      [compact, setCompact] = useState(false),
      [loggingOut, setLoggingOut] = useState(false);

   useEffect(() => {
      setMobile(false);
      document.querySelector('main')?.focus();
   }, [location.pathname]);

   useEffect(() => {
      document.body.style.overflow = mobile ? 'hidden' : '';
      const previous = document.activeElement as HTMLElement | null;
      const panel = document.querySelector<HTMLElement>('.sidebar');
      const appBody = document.querySelector<HTMLElement>('.app-body');
      if (appBody) appBody.inert = mobile;
      if (mobile) panel?.querySelector<HTMLElement>('a,button')?.focus();
      const handle = (e: KeyboardEvent) => {
         if (e.key === 'Escape') setMobile(false);
         if (mobile && e.key === 'Tab') { const items = Array.from(panel?.querySelectorAll<HTMLElement>('a,button:not(:disabled)') ?? []).filter(el => el.offsetParent !== null); const first = items[0], last = items[items.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
      }; window.addEventListener('keydown', handle); return () => { document.body.style.overflow = ''; if (appBody) appBody.inert = false; window.removeEventListener('keydown', handle); if (mobile) previous?.focus(); };
   }, [mobile]);

   if (auth.loading)
      return <div className="full-state"><Skeleton /></div>;
   if (auth.error)
      return <div className="full-state"><ErrorState error={auth.error} retry={auth.refetch} /></div>;
   if (!auth.user)
      return <Navigate to="/login" replace />;

   if (auth.user.role !== 'STUDENT')
      return <div className="full-state">
         <h1>واجهة الطلاب</h1>
         <p>هذا الحساب إداري. لوحة الإدارة ليست ضمن هذه المرحلة.</p>
         <Button onClick={() => void auth.logout()}>تسجيل الخروج</Button>
      </div>;


   const name = auth.user.full_name,
      selected = navigation.find(n => location.pathname === '/app' + (n.path ? '/' + n.path : ''))?.label ?? (location.pathname.startsWith('/app/planner/') ? 'تفاصيل المسودة' : location.pathname.startsWith('/app/tasks/') ? 'تفاصيل المهمة' : 'تفاصيل المساق');
   const logout = async () => {
      setLoggingOut(true);
      try {
         await auth.logout();
         toast('تم تسجيل الخروج.');
      } catch (e) {
         toast(errorMessage(e), 'error');
      } finally {
         setLoggingOut(false);
      }
   };
   return <div className={`app-shell ${compact ? 'compact' : ''}`}>
      <a href="#main-content" className="skip-link">تخطي إلى المحتوى</a>
      {mobile && <button className="nav-overlay" aria-label="إغلاق القائمة" onClick={() => setMobile(false)} />}
      <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
         <div className="side-brand">
            <Logo light />
            <button className="icon-btn mobile-only" aria-label="إغلاق القائمة" onClick={() => setMobile(false)}><
               X size={20} />
            </button>
         </div>
         <span className="side-section">مساحتك الأكاديمية</span>
         <nav aria-label="التنقل الرئيسي">
            {navigation.map((n, i) =>
               <NavLink title={n.label}
                  className={({ isActive }) => `side-link ${isActive ? 'active' : ''}${i === 5 ? 'nav-divider' : ''}`}
                  end={!n.path} key={n.path}
                  to={'/app' + (n.path ? '/' + n.path : '')}>
                  <n.icon size={19} />
                  <span>{n.label}</span>
                  {n.future && <small>قريبًا</small>}</NavLink>)}
         </nav>
         <div className="side-user"><
            StudentAvatar /><div>
               <strong>{name}</strong>
               <small>حساب طالب</small>
            </div>
            <button className="icon-btn" aria-label="تسجيل الخروج" disabled={loggingOut} onClick={() => void logout()}>
               <LogOut size={19} />
            </button>
         </div>
      </aside>
      <div className="app-body">
         <header className="topbar">
            <div className="top-context">
               <button className="icon-btn mobile-only" aria-label="فتح القائمة" aria-expanded={mobile}
                  onClick={() => setMobile(true)}>
                  <Menu size={22} />
               </button>
               <button className="icon-btn desktop-only"
                  aria-label={compact ? 'توسيع القائمة' : 'طي القائمة'}
                  onClick={() => setCompact(!compact)}>
                  <PanelRightClose size={20} />
               </button>
               <span>مساحتي <span className="crumb-separator">/</span>
                  <strong>{selected}</strong>
               </span>
            </div>
            <div className="topbar-actions">
               <ProductivityHeader />
               <AchievementCelebration />
               <details className="profile-dropdown">
                  <summary>
                     <StudentAvatar size={32} />
                     <span>{name.split(' ')[0]}</span>
                     <ChevronDown size={15} />
                  </summary>
                  <div>
                     <Link to="/app/profile">ملفي الأكاديمي</Link>
                     <button onClick={() => void logout()} disabled={loggingOut}>تسجيل الخروج</button>
                  </div>
               </details>
            </div>
         </header>
         <main id="main-content" tabIndex={-1} className="main-content">
            <Outlet />
         </main>
         <footer className="app-footer">مسار · رحلتك، خطوة بخطوة
            <span>البيانات المعروضة لا تشكّل قرار تخرج رسميًا</span>
         </footer>
      </div>
   </div>;
}



