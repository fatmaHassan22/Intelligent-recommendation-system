import { useState } from "react";
import { Trophy } from "lucide-react";
import { ErrorState, Modal, Notice, PageHeader, Skeleton } from "../../shared/ui";
import type { Achievement } from "./types";
import { useEngagement } from "./hooks";

export function BadgeGallery({
  items,
  compact = false,
}: {
  items: Achievement[];
  compact?: boolean;
}) {
  const [selected, setSelected] = useState<Achievement | null>(null);
  const ordered = compact
    ? [...items]
        .sort((a, b) => (b.earned_at ?? "").localeCompare(a.earned_at ?? ""))
        .slice(0, 3)
    : items;
  return (
    <>
      <div className={`eng-badges ${compact ? "compact-badges" : ""}`}>
        {ordered.map((a) => (
          <button
            className={`eng-badge ${a.earned_at ? "earned" : "locked"}`}
            key={a.code}
            onClick={() => setSelected(a)}
            aria-label={`تفاصيل ${a.title}`}
          >
            <span className="badge-art">
              <Trophy size={28} />
            </span>
            <strong>{a.title}</strong>
            <small>{a.earned_at ? "مكتسبة" : "لم تُفتح بعد"}</small>
            <progress value={a.progress} max={a.target} aria-label={`تقدم ${a.title}`} />
            <span dir="ltr">
              {a.progress} / {a.target}
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <Modal
          className="eng-modal"
          title={selected.title}
          onClose={() => setSelected(null)}
        >
          <p>{selected.description}</p>
          <p>
            {selected.earned_at
              ? `اكتُسبت في ${new Date(selected.earned_at).toLocaleDateString("ar")}`
              : `التقدم: ${selected.progress} من ${selected.target}`}
          </p>
          <Notice>
            الشارات تعكس نشاطًا مسجلًا في التطبيق، وليست تقييمًا أو توثيقًا جامعيًا.
          </Notice>
        </Modal>
      )}
    </>
  );
}

export function AchievementsPage() {
  const q = useEngagement<Achievement[]>("/achievements");
  return (
    <>
      <PageHeader
        eyebrow="إنجازك يستحق أن يُرى"
        title="الإنجازات والشارات"
        description="شارات شخصية تُفتح تلقائيًا من نشاطك الحقيقي، دون ترتيب أو منافسة بين الطلاب."
      />
      {q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.isPending ? (
        <Skeleton />
      ) : (
        <BadgeGallery items={q.data} />
      )}
    </>
  );
}
