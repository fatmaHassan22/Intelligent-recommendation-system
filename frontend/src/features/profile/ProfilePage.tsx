import { StudentAvatar } from "../engagement/AvatarSvg";
import { Link } from "react-router-dom";
import { Palette } from "lucide-react";
import { useProfile } from "../../shared/hooks/academic";
import { ErrorState, PageHeader, Skeleton } from "../../shared/ui";
import { ProfileForm } from "./ProfileForm";

export function ProfilePage() {
  const query = useProfile();
  return (
    <>
      <PageHeader
        eyebrow="حساب يتبعك"
        title="ملفي الأكاديمي"
        description="راجع بياناتك وخطتك وتفضيلاتك، وعدّل ما يدعمه حسابك."
      />
      {query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : query.isPending ? (
        <Skeleton />
      ) : (
        <>
          <section
            className="profile-personalization-grid"
            aria-label="تخصيص مظهر الحساب"
          >
            <Link className="profile-personalization-card surface" to="/app/avatar">
              <span className="profile-avatar-preview">
                <StudentAvatar size={54} />
              </span>
              <span>
                <strong>تخصيص الأفاتار</strong>
                <small>اختر الشخصية والألوان التي تمثلك</small>
              </span>
              <span className="personalization-arrow">←</span>
            </Link>
            <Link className="profile-personalization-card surface" to="/app/theme">
              <span className="profile-theme-preview">
                <Palette size={24} />
              </span>
              <span>
                <strong>تخصيص الثيم</strong>
                <small>اختر ألوانًا تناسب أجواء دراستك</small>
              </span>
              <span className="personalization-arrow">←</span>
            </Link>
          </section>
          <ProfileForm profile={query.data} />
        </>
      )}
    </>
  );
}
