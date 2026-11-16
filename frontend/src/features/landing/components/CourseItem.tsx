import Badge from "./Badge";

const labels: Record<string, string> = { recommended: "مُوصى به", postpone: "أجّله" };

type Props = { name: string; status: string; reason: string; delay?: number };

export default function CourseItem({ name, status, reason, delay = 0 }: Props) {
  const postponed = status === "postpone";
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={`animate-pop rounded-xl p-4 ${postponed ? "border border-dashed border-[#B8C4D8]" : "mb-3 border border-line"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <strong>{name}</strong>
        <Badge tone={postponed ? "neutral" : "accent"}>{labels[status]}</Badge>
      </div>
      <p className="mt-1.5 text-sm text-muted">{reason}</p>
    </div>
  );
}
