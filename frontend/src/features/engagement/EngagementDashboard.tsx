import { Link } from "react-router-dom";
import { ErrorState, Skeleton } from "../../shared/ui";
import type { Achievement, Streak } from "./types";
import { useEngagement } from "./hooks";
import { StudentAvatar } from "./AvatarSvg";
import { StreakCard } from "./StreakPage";
import { BadgeGallery } from "./AchievementsPage";
import { NewsTicker } from "./NewsTicker";

export function EngagementDashboard({ showBadges = true }: { showBadges?: boolean }) {
  const streak = useEngagement<Streak>("/streaks"),
    badges = useEngagement<Achievement[]>("/achievements", showBadges);
  return (
    <>
      <div
        className={`eng-dashboard ${showBadges ? "" : "eng-dashboard-without-badges"}`}
      >
        <div>
          {streak.error ? (
            <ErrorState error={streak.error} retry={() => void streak.refetch()} />
          ) : streak.isPending ? (
            <Skeleton />
          ) : (
            <StreakCard value={streak.data} />
          )}
        </div>
        {showBadges && (
          <section className="surface">
            <div className="section-heading">
              <div className="eng-person">
                <StudentAvatar size={64} />
                <h2>مجموعة إنجازاتك</h2>
              </div>
              <Link to="/app/achievements">كل الشارات</Link>
            </div>
            {badges.error ? (
              <ErrorState error={badges.error} retry={() => void badges.refetch()} />
            ) : badges.isPending ? (
              <Skeleton />
            ) : (
              <BadgeGallery items={badges.data} compact />
            )}
            <Link className="helper" to="/app/avatar">
              تخصيص الأفاتار
            </Link>
          </section>
        )}
      </div>
      <NewsTicker />
    </>
  );
}
