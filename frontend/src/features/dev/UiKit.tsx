import { useState } from "react";
import { Plus, Trash2, GraduationCap } from "lucide-react";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Input,
  Modal,
  Notice,
  PageHeader,
  Select,
  Skeleton,
  Stat,
  useToast,
} from "../../shared/ui";

/**
 * معرض مكونات shared/ui (للتطوير فقط: /app/_ui).
 * يُستخدم لمراجعة أي تغيير بصري على المكونات في كل حالاتها دفعة واحدة.
 */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="surface" style={{ marginBottom: 20 }}>
    <h2 style={{ marginTop: 0, fontSize: 16 }}>{title}</h2>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start" }}>
      {children}
    </div>
  </section>
);

export default function UiKit() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  return (
    <div data-testid="uikit">
      <PageHeader
        eyebrow="معرض المكونات"
        title="مكونات الواجهة المشتركة"
        description="كل مكون بكل حالاته، لمراجعة التصميم دفعة واحدة."
        action={<Button>إجراء رئيسي</Button>}
      />
      <Section title="Button">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">
          <Trash2 size={16} /> Danger
        </Button>
        <Button busy>جارٍ الحفظ</Button>
        <Button disabled>معطّل</Button>
        <Button>
          <Plus size={16} /> مع أيقونة
        </Button>
      </Section>
      <Section title="Badge">
        <Badge>neutral</Badge>
        <Badge tone="teal">teal</Badge>
        <Badge tone="amber">amber</Badge>
        <Badge tone="blue">blue</Badge>
      </Section>
      <Section title="Input / Select">
        <Input label="الاسم الكامل" placeholder="مثال: فاطمة أحمد" hint="كما في الهوية" />
        <Input label="حقل معطّل" disabled defaultValue="غير قابل للتعديل" />
        <Select label="التخصص" defaultValue="cs">
          <option value="cs">علم الحاسوب</option>
          <option value="se">هندسة البرمجيات</option>
        </Select>
      </Section>
      <Section title="Stat">
        <Stat
          label="المعدل التراكمي"
          value="3.42"
          hint="من 4.00"
          icon={<GraduationCap size={20} />}
        />
        <Stat
          label="الساعات المنجزة"
          value="96"
          hint="من 132 ساعة"
          icon={<GraduationCap size={20} />}
        />
      </Section>
      <Section title="Notice / Empty / Error / Skeleton">
        <Notice>هذه رسالة توضيحية للمستخدم.</Notice>
        <Empty
          title="لا توجد مهام بعد"
          description="أضف أول مهمة لتبدأ بتنظيم دراستك."
          action={<Button>إضافة مهمة</Button>}
        />
        <ErrorState error={new Error("x")} retry={() => {}} />
        <Skeleton />
      </Section>
      <Section title="Modal / Confirm / Toast">
        <Button variant="secondary" onClick={() => setModal(true)}>
          فتح نافذة
        </Button>
        <Button variant="secondary" onClick={() => setConfirm(true)}>
          نافذة تأكيد
        </Button>
        <Button variant="ghost" onClick={() => toast("تم الحفظ بنجاح")}>
          Toast نجاح
        </Button>
        <Button variant="ghost" onClick={() => toast("تعذر الحفظ", "error")}>
          Toast خطأ
        </Button>
      </Section>
      {modal && (
        <Modal title="عنوان النافذة" onClose={() => setModal(false)}>
          <p>محتوى النافذة.</p>
        </Modal>
      )}
      {confirm && (
        <Confirm
          title="حذف المهمة؟"
          description="لا يمكن التراجع عن هذا الإجراء."
          busy={false}
          onConfirm={() => setConfirm(false)}
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
