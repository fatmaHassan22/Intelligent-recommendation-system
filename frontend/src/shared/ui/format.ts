export const number = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "غير معروف"
    : new Intl.NumberFormat("ar").format(value);

export const roleLabel = (value: string) =>
  ({ REQUIRED: "إجباري", ELECTIVE: "اختياري", UNVERIFIED: "غير متحقق" })[value] ??
  "غير معروف";

export const modeLabel = (value: string) =>
  ({ LIGHT: "خفيف", BALANCED: "متوازن", FAST_GRADUATION: "تخرج أسرع" })[value] ?? value;
