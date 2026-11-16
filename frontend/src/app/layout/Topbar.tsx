import { Link } from "react-router-dom";
import { ChevronDown, Menu, PanelRightClose } from "lucide-react";
import { appPath } from "../../config/navigation";
import { layoutText } from "../../config/strings.ar";
import { AchievementCelebration } from "../../features/engagement/AchievementCelebration";
import { StudentAvatar } from "../../features/engagement/AvatarSvg";
import { ProductivityHeader } from "../../features/productivity/ProductivityHeader";
import { cn } from "../../shared/lib/cn";
import { iconButtonClass } from "../../shared/ui";

interface TopbarProps {
  title: string;
  userName: string;
  mobileOpen: boolean;
  compact: boolean;
  loggingOut: boolean;
  onOpenMenu: () => void;
  onToggleCompact: () => void;
  onLogout: () => void;
}

const menuItem =
  "block w-full rounded-lg px-2.5 py-2 text-start text-[12px] text-fg transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-55";

export function Topbar({
  title,
  userName,
  mobileOpen,
  compact,
  loggingOut,
  onOpenMenu,
  onToggleCompact,
  onLogout,
}: TopbarProps) {
  return (
    <header className="flex h-[78px] items-center justify-between gap-3 border-b border-topbar-edge bg-topbar px-[37px] max-[1100px]:px-[25px] max-[800px]:h-[65px] max-[800px]:px-[22px] max-[560px]:px-4">
      <div className="flex items-center gap-[13px] text-[12px] text-fg-muted max-[560px]:gap-1.5">
        <button
          className={cn(iconButtonClass(), "min-[801px]:hidden")}
          aria-label={layoutText.openMenu}
          aria-expanded={mobileOpen}
          onClick={onOpenMenu}
        >
          <Menu size={22} />
        </button>
        <button
          className={cn(iconButtonClass(), "max-[800px]:hidden")}
          aria-label={compact ? layoutText.expandSidebar : layoutText.collapseSidebar}
          onClick={onToggleCompact}
        >
          <PanelRightClose size={20} />
        </button>
        <span>
          {layoutText.breadcrumbRoot}
          <span className="px-[11px] opacity-50 max-[560px]:px-[7px]">/</span>
          <strong className="font-semibold text-brand-text">{title}</strong>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <ProductivityHeader />
        <AchievementCelebration />
        <details className="group relative text-[12px]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg text-fg focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
            <StudentAvatar size={32} />
            <span className="max-[560px]:hidden">{userName.split(" ")[0]}</span>
            <ChevronDown
              size={15}
              className="transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="absolute end-0 top-[45px] z-[25] w-[170px] rounded-[10px] border border-edge bg-panel p-2 shadow-card">
            <Link to={appPath("profile")} className={menuItem}>
              {layoutText.myAcademicProfile}
            </Link>
            <button onClick={onLogout} disabled={loggingOut} className={menuItem}>
              {layoutText.logout}
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
