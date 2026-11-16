import { EngagementSettings } from "../engagement/EngagementSettings";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Notice, PageHeader } from "../../shared/ui";

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="الإعدادات"
        description="إعدادات الحساب المتاحة في هذه المرحلة."
      />
      <section className="surface settings-card">
        <div>
          <ShieldCheck size={35} />
          <h2>حسابك وخصوصيتك</h2>
          <p>تعديل الاسم والتخصص والخطة وتفضيلات الدراسة متاح من ملفك الأكاديمي.</p>
          <Link className="btn btn-primary" to="/app/profile">
            فتح الملف الأكاديمي
          </Link>
          <Link className="btn btn-secondary" to="/app/notifications">
            مركز الإشعارات وتفضيلاته
          </Link>
        </div>
        <Notice>
          يمكنك ضبط التوقيت وتذكيرات المهام والأحداث من مركز الإشعارات. تغيير البريد وكلمة
          المرور غير متاحين حاليًا.
        </Notice>
      </section>
      <EngagementSettings />
    </>
  );
}
