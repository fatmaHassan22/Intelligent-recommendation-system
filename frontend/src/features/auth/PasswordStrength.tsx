export function PasswordStrength({ value }: { value: string }) {
  const score = [
    value.length >= 12,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
  const labels = ["ضعيفة", "ضعيفة", "مقبولة", "جيدة", "قوية"];
  const colors = ["", "bg-[#e5534b]", "bg-[#e6a23c]", "bg-[#7bc67e]", "bg-accent"];
  return (
    <div className="mt-2.5 flex min-h-[18px] items-center gap-3" aria-live="polite">
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-[5px] rounded-full transition-all duration-500 ${i <= score ? `${colors[score]} scale-y-[1.3]` : "bg-[#e8eef4]"}`}
          />
        ))}
      </div>
      <span className="min-w-12 text-xs font-semibold text-muted">
        {value ? labels[score] : ""}
      </span>
    </div>
  );
}
