import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * يدمج أسماء الـ classes ويحل تعارضات Tailwind (الأخير يغلب):
 *   cn("px-4 py-2", isBig && "px-6", className) → "py-2 px-6"
 * استخدمه في كل مكوّن يقبل className من الخارج.
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
