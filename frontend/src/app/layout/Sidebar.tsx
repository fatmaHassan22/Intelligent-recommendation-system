import type { Ref } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { appPath, navigation } from "../../config/navigation";
import { layoutText } from "../../config/strings.ar";
import { StudentAvatar } from "../../features/engagement/AvatarSvg";
import { Logo } from "../../shared/ui/Logo";

interface SidebarProps {
  ref?: Ref<HTMLElement>;
  userName: string;
  mobileOpen: boolean;
  loggingOut: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const linkClass = (isActive: boolean, divider?: boolean) =>
  ["side-link", isActive && "active", divider && "nav-divider"].filter(Boolean).join(" ");

export function Sidebar({
  ref,
  userName,
  mobileOpen,
  loggingOut,
  onClose,
  onLogout,
}: SidebarProps) {
  return (
    <aside ref={ref} className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="side-brand">
        <Logo light />
        <button
          className="icon-btn mobile-only"
          aria-label={layoutText.closeMenu}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>

      <span className="side-section">{layoutText.sidebarSection}</span>

      <nav aria-label={layoutText.mainNavLabel}>
        {navigation.map(({ path, label, icon: Icon, divider, future }) => (
          <NavLink
            key={path}
            to={appPath(path)}
            end={!path}
            title={label}
            className={({ isActive }) => linkClass(isActive, divider)}
          >
            <Icon size={19} />
            <span>{label}</span>
            {future && <small>{layoutText.comingSoon}</small>}
          </NavLink>
        ))}
      </nav>

      <div className="side-user">
        <StudentAvatar />
        <div>
          <strong>{userName}</strong>
          <small>{layoutText.studentAccount}</small>
        </div>
        <button
          className="icon-btn"
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
