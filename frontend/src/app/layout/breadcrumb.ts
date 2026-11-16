import { appPath, navigation } from "../../config/navigation";
import { breadcrumbText } from "../../config/strings.ar";

/** صفحات خارج القائمة الجانبية، تُطابَق بالمسار الكامل. */
const exactTitles: Record<string, string> = {
  [appPath("theme")]: breadcrumbText.theme,
};

/** صفحات التفاصيل الديناميكية، تُطابَق ببداية المسار. */
const prefixTitles: readonly (readonly [prefix: string, title: string])[] = [
  [appPath("planner") + "/", breadcrumbText.planDraft],
  [appPath("tasks") + "/", breadcrumbText.task],
  [appPath("curriculum") + "/", breadcrumbText.course],
];

/** يرجع عنوان الصفحة الحالية لعرضه في شريط المسار (breadcrumb). */
export function getBreadcrumbTitle(pathname: string): string {
  const nav = navigation.find((item) => appPath(item.path) === pathname);
  if (nav) return nav.label;

  if (pathname in exactTitles) return exactTitles[pathname];

  const dynamic = prefixTitles.find(([prefix]) => pathname.startsWith(prefix));
  return dynamic ? dynamic[1] : breadcrumbText.notFound;
}
