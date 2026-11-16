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
    <div data-compact={compact} className="group/shell min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-panel focus:px-5 focus:py-2.5 focus:text-fg focus:shadow-pop"
      >
        {layoutText.skipToContent}
      </a>

      {drawer.isOpen && (
        <button
          className="fixed inset-0 z-[29] border-0 bg-overlay backdrop-blur-[2px] min-[801px]:hidden"
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
      <div
        className="transition-[margin] duration-200 min-[801px]:ms-[220px] min-[1101px]:ms-[246px] min-[801px]:group-data-[compact=true]/shell:ms-[83px]"
        inert={drawer.isOpen}
      >
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
        <main
          ref={mainRef}
          id="main-content"
          tabIndex={-1}
          className="mx-auto min-h-[calc(100vh-130px)] max-w-[1380px] px-[37px] pt-[27px] pb-5 outline-none min-[1600px]:pt-[34px] max-[1100px]:p-[25px] max-[800px]:p-[22px]"
        >
          <Suspense fallback={<Skeleton />}>
            <Outlet />
          </Suspense>
        </main>
        <AppFooter />
      </div>
    </div>
  );
}
