import { Notice } from "../../shared/ui";

export function Completeness() {
  return (
    <Notice>
      <strong>صورة واضحة، ضمن البيانات المتاحة</strong>
      <p>
        هذه الأرقام تخص المساقات المسجلة في خطتك الحالية. بعض متطلبات الدرجة لم تُستكمل،
        لذا لا نعرض نسبة تخرج أو أهلية تخرج رسمية.
      </p>
    </Notice>
  );
}
