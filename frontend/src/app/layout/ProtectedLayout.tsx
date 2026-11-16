import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { layoutText } from "../../config/strings.ar";
import { Skeleton } from "../../shared/ui";
import { AppFooter } from "./AppFooter";
import { getBreadcrumbTitle } from "./breadcrumb";
import { RequireStudent } from "./RequireStudent";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useLogout } from "./useLogout";
import { useMobileDrawer } from "./useMobileDrawer";

/** هيكل صفحات الطالب: قائمة جانبية + شريط علوي + المحتوى + تذييل. */
export function ProtectedLayout() {
  return (
    <RequireStudent>{(user) => <AppShell userName={user.full_name} />}</RequireStudent>
  );
}

function AppShell({ userName }: { userName: string }) {
  const { pathname } = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const drawer = useMobileDrawer(sidebarRef);
  const [compact, setCompact] = useState(false);
  const { logout, loggingOut } = useLogout();

  // عند كل تنقل: أغلق القائمة وانقل التركيز للمحتوى (إتاحة الوصول).
  const closeDrawer = drawer.close;
  useEffect(() => {
    closeDrawer();
    mainRef.current?.focus();
  }, [pathname, closeDrawer]);

  return (
    <div className={`app-shell ${compact ? "compact" : ""}`}>
      <a href="#main-content" className="skip-link">
        {layoutText.skipToContent}
      </a>

      {drawer.isOpen && (
        <button
          className="nav-overlay"
          aria-label={layoutText.closeMenu}
          onClick={drawer.close}
        />
      )}

      <Sidebar
        ref={sidebarRef}
        userName={userName}
        mobileOpen={drawer.isOpen}
        loggingOut={loggingOut}
        onClose={drawer.close}
        onLogout={() => void logout()}
      />

      {/* inert: يمنع التركيز والنقر على المحتوى خلف القائمة المفتوحة */}
      <div className="app-body" inert={drawer.isOpen}>
        <Topbar
          title={getBreadcrumbTitle(pathname)}
          userName={userName}
          mobileOpen={drawer.isOpen}
          compact={compact}
          loggingOut={loggingOut}
          onOpenMenu={drawer.open}
          onToggleCompact={() => setCompact((value) => !value)}
          onLogout={() => void logout()}
        />
        <main ref={mainRef} id="main-content" tabIndex={-1} className="main-content">
          <Suspense fallback={<Skeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
