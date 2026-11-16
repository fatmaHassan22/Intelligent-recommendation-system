import { lazy, type ComponentType } from "react";

/**
 * تحميل كسول لمكوّن مُصدَّر باسم (named export):
 *   const Page = lazyNamed(() => import("./Page"), "Page");
 * كل import() يُنتج ملف JS مستقلاً لا يُحمَّل إلا عند أول زيارة للصفحة.
 */
export function lazyNamed<M extends Record<string, unknown>, K extends keyof M>(
  load: () => Promise<M>,
  name: K,
) {
  return lazy(async () => ({ default: (await load())[name] as ComponentType }));
}
