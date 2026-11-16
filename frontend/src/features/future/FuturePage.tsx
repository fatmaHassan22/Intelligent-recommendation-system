import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Construction, Compass } from "lucide-react";
import { navigation } from "../../config/navigation";
import { Badge, PageHeader, buttonClass } from "../../shared/ui";
const descriptions: Record<string, string> = {
  recommendations:
    "توصيات المساقات تحتاج محركًا يعتمد على بيانات أكاديمية مكتملة. هذه المرحلة تعرض خطتك وإنجازك فقط.",
  planner:
    "سيتيح المخطط تنظيم اختياراتك الدراسية بعد تطوير الخدمات اللازمة واعتماد قواعد الجامعة.",
  tasks: "ستتمكن من تنظيم مهامك ومتابعة إنجازها عند إتاحة هذه الميزة.",
  calendar: "التقويم يحتاج مصادر مواعيد فعلية وخدمة لحفظ أحداثك، وهي غير متاحة بعد.",
  pomodoro: "مؤقت الدراسة وتتبع جلساتها جزء من مرحلة الأدوات الإنتاجية القادمة.",
  notifications: "لا توجد خدمة إشعارات أو رسائل محفوظة حاليًا.",
  assistant: "المساعد الدراسي يحتاج خدمات ذكاء اصطناعي معتمدة، ولم تُبنَ في هذه المرحلة.",
};
export function FuturePage() {
  const slug = useLocation().pathname.split("/").at(-1) ?? "",
    item = navigation.find((n) => n.path === slug),
    Icon = item?.icon ?? Construction;
  return (
    <>
      <PageHeader
        title={item?.label ?? "صفحة غير موجودة"}
        description="هذه الميزة ستُضاف في مرحلة لاحقة."
      />
      <section className="future-page surface">
        <span className="future-icon">
          <Icon size={40} />
        </span>
        <Badge tone="teal">قيد التطوير</Badge>
        <h2>مساحة لخطوتك القادمة</h2>
        <p>
          {descriptions[slug] ?? "هذه الصفحة غير متاحة. يمكنك العودة لمساحتك الأكاديمية."}
        </p>
        <Link className={buttonClass("secondary")} to="/app">
          <ArrowRight size={17} />
          العودة للرئيسية
        </Link>

        <div className="future-footnote">
          <Compass size={17} /> المتاح الآن: خطتك، إنجازاتك، تقدمك، توصياتك، المخطط،
          المهام، التقويم، بومودورو والإشعارات.
        </div>
      </section>
    </>
  );
}
