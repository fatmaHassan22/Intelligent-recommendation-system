import type { Category } from "./api";

export const categoryLabels: Record<Category, string> = {
  SUITABLE: "مناسب أكاديميًا",
  BLOCKED: "غير مستوفٍ",
  UNVERIFIED: "يحتاج تحققًا",
  NOT_OFFERED: "مؤكد عدم الطرح",
};

export const offeringLabels = {
  NOT_RECORDED: "الطرح الفعلي غير مسجل",
  UNVERIFIED: "سجل الطرح غير موثق رسميًا",
  CONFIRMED_OFFERED: "مؤكد الطرح",
  CONFIRMED_NOT_OFFERED: "مؤكد عدم الطرح",
};
