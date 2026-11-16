type Props = { value: number; size?: number };

export default function ProgressRing({ value, size = 150 }: Props) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="تقدّم اليوم"
    >
      <svg
        viewBox="0 0 128 128"
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle cx="64" cy="64" r={r} fill="none" stroke="#E3F4F1" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#0B7A6E"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
        {value}%
      </div>
    </div>
  );
}
