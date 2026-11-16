import type { Avatar } from "./types";

export const categoryLabels: Record<string, string> = {
  AI_TECH: "الذكاء الاصطناعي والتقنية",
  LEARNING: "فرص التعلّم",
  SCHOLARSHIPS: "المنح والفرص التعليمية",
  UNIVERSITY: "إعلانات الجامعة",
  DEADLINES: "الامتحانات والمواعيد",
  LIGHTHEARTED: "رسائل تعليمية خفيفة",
};

export const initialAvatar: Avatar = {
  style: "STUDENT",
  color: "#239B91",
  background: "#E4F3EE",
  eyes: "ROUND",
  accessory: "NONE",
};
