import { Link } from "react-router-dom";
import { ChevronDown, Menu, PanelRightClose } from "lucide-react";
import { appPath } from "../../config/navigation";
import { layoutText } from "../../config/strings.ar";
import { AchievementCelebration } from "../../features/engagement/AchievementCelebration";
import { StudentAvatar } from "../../features/engagement/AvatarSvg";
import { ProductivityHeader } from "../../features/productivity/ProductivityHeader";

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
    <header className="topbar">
      <div className="top-context">
        <button
          className="icon-btn mobile-only"
          aria-label={layoutText.openMenu}
          aria-expanded={mobileOpen}
          onClick={onOpenMenu}
        >
          <Menu size={22} />
        </button>
        <button
          className="icon-btn desktop-only"
          aria-label={
            compact ? layoutText.expandSidebar : layoutText.collapseSidebar
          }
          onClick={onToggleCompact}
        >
          <PanelRightClose size={20} />
        </button>

        <span className="text-xl font-800 text-gray-700 flex items-center gap-1 ">
          {layoutText.breadcrumbRoot} <span className="crumb-separator">/</span>{" "}
          <strong className="text-gray-900">{title}</strong>
        </span>
      </div>

      <div className="topbar-actions">
        <ProductivityHeader />
        <AchievementCelebration />
        <details className="profile-dropdown">
          <summary>
            <StudentAvatar size={32} />
            <span>{userName.split(" ")[0]}</span>
            <ChevronDown size={15} />
          </summary>
          <div>
            <Link to={appPath("profile")}>{layoutText.myAcademicProfile}</Link>
            <button onClick={onLogout} disabled={loggingOut}>
              {layoutText.logout}
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
