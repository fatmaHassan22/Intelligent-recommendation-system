import type { Ref } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { appPath, navigation } from "../../config/navigation";
import { layoutText } from "../../config/strings.ar";
import { StudentAvatar } from "../../features/engagement/AvatarSvg";
import { cn } from "../../shared/lib/cn";
import { iconButtonClass, Logo } from "../../shared/ui";

/**
 * الشريط الجانبي.
 * نقاط التوقف (متوافقة مع باقي المشروع): الجوال ≤ 800px (drawer)، متوسط 801–1100px، واسع > 1100px.
 * الوضع المضغوط (compact) يعمل فقط من 801px وما فوق، ويُقرأ من data-compact على الجذر (group/shell).
 */
const asideClass = cn(
  "fixed inset-y-0 start-0 z-30 flex flex-col bg-rail pt-[25px] pb-[15px] text-rail-fg",
  "transition-[width,transform,background-color] duration-200",
  // الجوال: drawer عرضه ثابت ينزلق من اليمين
  "w-[246px] translate-x-full px-[17px]",
  // سطح المكتب: ثابت دائماً على الشاشة
  "min-[801px]:translate-x-0 min-[801px]:w-[220px] min-[801px]:px-3 min-[1101px]:w-[246px] min-[1101px]:px-[17px]",
  `min-[801px]:group-data-[compact=true]/shell:w-[83px] min-[801px]:group-data-[compact=true]/shell:px-2.5`,
);

const hideWhenCompact = "min-[801px]:group-data-[compact=true]/shell:hidden";

interface SidebarProps {
  ref?: Ref<HTMLElement>;
  userName: string;
  mobileOpen: boolean;
  loggingOut: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({
  ref,
  userName,
  mobileOpen,
  loggingOut,
  onClose,
  onLogout,
}: SidebarProps) {
  return (
    <aside ref={ref} className={cn(asideClass, mobileOpen && "translate-x-0")}>
      <div className="flex items-center justify-between px-2 pb-[22px]">
        <Logo light textClassName={hideWhenCompact} />
        <button
          className={cn(
            iconButtonClass("text-white/70 hover:bg-white/10 hover:text-white"),
            "min-[801px]:hidden",
          )}
          aria-label={layoutText.closeMenu}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <span
        className={cn(
          "mb-2.5 px-[13px] text-xs tracking-wide text-rail-accent",
          hideWhenCompact,
        )}
      >
        {layoutText.sidebarSection}
      </span>

      <nav
        aria-label={layoutText.mainNavLabel}
        className="min-h-0 flex-1 overflow-y-auto pb-3 [scrollbar-color:rgb(255_255_255/0.2)_transparent] [scrollbar-width:thin]"
      >
        {navigation.map(({ path, label, icon: Icon, divider, future }) => (
          <NavLink
            key={path}
            to={appPath(path)}
            end={!path}
            title={label}
            className={({ isActive }) =>
              cn(
                "mb-0.5 flex min-h-[38px] items-center gap-3 rounded-[9px] px-[13px] py-[9px] text-[12px] text-rail-fg transition-colors",
                "hover:bg-brand/20 hover:text-white",
                "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white/70",
                `min-[801px]:group-data-[compact=true]/shell:justify-center min-[801px]:group-data-[compact=true]/shell:p-[11px]`,
                divider && "mt-3 border-t border-white/10 pt-3",
                isActive &&
                  "bg-rail-active text-white shadow-[inset_-3px_0_var(--teal)] [&_svg]:text-rail-accent",
                !isActive && "[&_svg]:text-white/50",
              )
            }
          >
            <Icon size={19} className="shrink-0" />
            <span className={hideWhenCompact}>{label}</span>
            {future && (
              <small
                className={cn(
                  "ms-auto rounded bg-white/10 px-1.5 text-xs",
                  hideWhenCompact,
                )}
              >
                {layoutText.comingSoon}
              </small>
            )}
          </NavLink>
        ))}
      </nav>

      <div
        className={cn(
          "flex items-center gap-2.5 border-t border-white/15 px-2 pt-4",
          `min-[801px]:group-data-[compact=true]/shell:justify-center`,
        )}
      >
        <StudentAvatar />
        <div className={cn("min-w-0 flex-1", hideWhenCompact)}>
          <strong className="block truncate text-[12px] font-semibold text-white">
            {userName}
          </strong>
          <small className="block text-xs text-rail-muted">
            {layoutText.studentAccount}
          </small>
        </div>
        <button
          className={cn(
            iconButtonClass("text-white/60 hover:bg-white/10 hover:text-white"),
            hideWhenCompact,
          )}
          aria-label={layoutText.logout}
          disabled={loggingOut}
          onClick={onLogout}
        >
          <LogOut size={19} />
        </button>
      </div>
    </aside>
  );
}
