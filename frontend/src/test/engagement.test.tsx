import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "../shared/api/client";
import { ToastProvider } from "../shared/ui";
import { AvatarEditor } from "../features/engagement/AvatarPage";
import { AvatarSvg } from "../features/engagement/AvatarSvg";
import { initialAvatar } from "../features/engagement/constants";
import { StreakCard } from "../features/engagement/StreakPage";
import { BadgeGallery } from "../features/engagement/AchievementsPage";
import { NewsTicker } from "../features/engagement/NewsTicker";
import { EngagementSettings } from "../features/engagement/EngagementSettings";
import { AchievementCelebration } from "../features/engagement/AchievementCelebration";
import { EngagementDashboard } from "../features/engagement/EngagementDashboard";
import { type Achievement, type Streak } from "../features/engagement/types";
const streak: Streak = {
  current_streak: 3,
  longest_streak: 7,
  last_activity_date: "2026-10-12",
  timezone: "Asia/Hebron",
  message: "خطوة كل يوم",
  history_note: "التاريخ محفوظ",
  weekly_activity: [
    { date: "2026-10-12", active: true },
    { date: "2026-10-11", active: false },
  ],
};
let badges: Achievement[], news: any[], prefs: any;
const clients: QueryClient[] = [];
beforeEach(() => {
  badges = [
    {
      code: "FIRST_STEP",
      title: "الخطوة الأولى",
      description: "إكمال أول مهمة",
      target: 1,
      progress: 1,
      earned_at: "2026-10-12T08:00Z",
      celebrated_at: "2026-10-12T08:01Z",
    },
    {
      code: "FOCUS_MASTER",
      title: "خبير التركيز",
      description: "عشر جلسات",
      target: 10,
      progress: 2,
      earned_at: null,
      celebrated_at: null,
    },
  ];
  news = [];
  prefs = {
    timezone: "Asia/Hebron",
    notification_tone: "PROFESSIONAL",
    achievement_notifications: true,
    ticker_visible: true,
    ticker_categories: ["LIGHTHEARTED", "AI_TECH"],
  };
  vi.spyOn(api, "get").mockImplementation(async (path: string) => {
    if (path.endsWith("/streaks")) return { data: streak } as any;
    if (path.endsWith("/achievements")) return { data: badges } as any;
    if (path.endsWith("/avatar")) return { data: initialAvatar } as any;
    if (path.endsWith("/engagement-preferences")) return { data: prefs } as any;
    if (path.startsWith("/ticker")) return { data: news } as any;
    throw new Error("unexpected route " + path);
  });
  vi.spyOn(api, "mutate").mockImplementation(
    async (path: string, _method: string, body: any) => {
      if (path.endsWith("/engagement-preferences")) prefs = body;
      if (path.includes("/celebrate"))
        badges = badges.map((b) => ({ ...b, celebrated_at: "2026-10-12T08:02Z" }));
      return { data: body } as any;
    },
  );
});
afterEach(() => {
  clients.forEach((c) => c.clear());
  clients.length = 0;
  vi.restoreAllMocks();
});
function mount(node: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchInterval: false },
      mutations: { retry: false },
    },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ToastProvider>{node}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
it("renders accessible SVG without external image requests", () => {
  mount(<AvatarSvg value={{ ...initialAvatar, style: "CAT", accessory: "GLASSES" }} />);
  expect(screen.getByRole("img", { name: "أفاتار قطة" })).toBeTruthy();
  expect(document.querySelectorAll("image")).toHaveLength(0);
});
it("previews avatar before save then submits preferences to backend", async () => {
  mount(<AvatarEditor value={initialAvatar} />);
  fireEvent.change(screen.getByLabelText("أسلوب الأفاتار"), {
    target: { value: "ROBOT" },
  });
  expect(screen.getByRole("img", { name: "أفاتار روبوت" })).toBeTruthy();
  expect(api.mutate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "حفظ الأفاتار" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith(
      "/students/me/avatar",
      "PATCH",
      expect.objectContaining({ style: "ROBOT" }),
    ),
  );
});
it("reset changes preview only until student saves", () => {
  mount(<AvatarEditor value={{ ...initialAvatar, style: "CAT" }} />);
  fireEvent.click(screen.getByRole("button", { name: "إعادة المعاينة للافتراضي" }));
  expect(screen.getByRole("img", { name: "أفاتار طالب" })).toBeTruthy();
  expect(api.mutate).not.toHaveBeenCalled();
});
it("weekly streak shows server-provided active and inactive days", () => {
  mount(<StreakCard value={streak} />);
  expect(screen.getByLabelText("2026-10-12: نشاط مسجل")).toBeTruthy();
  expect(screen.getByLabelText("2026-10-11: دون نشاط")).toBeTruthy();
  expect(screen.getByText("أطول سلسلة")).toBeTruthy();
});
it("earned and locked badges show actual progress and achievement details", () => {
  mount(<BadgeGallery items={badges} />);
  expect(screen.getByText("مكتسبة")).toBeTruthy();
  expect(screen.getByText("لم تُفتح بعد")).toBeTruthy();
  expect(
    (
      screen.getByRole("progressbar", {
        name: "تقدم خبير التركيز",
      }) as HTMLProgressElement
    ).value,
  ).toBe(2);
  fireEvent.click(screen.getByRole("button", { name: "تفاصيل خبير التركيز" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByText("عشر جلسات")).toBeTruthy();
});
it("celebrates a verified earned badge then acknowledges it on server", async () => {
  badges[0].celebrated_at = null;
  mount(<AchievementCelebration />);
  await screen.findByRole("dialog", { name: "شارة جديدة!" });
  fireEvent.click(screen.getByRole("button", { name: "جميل، لنكمل!" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith(
      "/students/me/achievements/FIRST_STEP/celebrate",
      "POST",
    ),
  );
});
it("ticker empty state never invents news and hidden preference removes ticker", async () => {
  const view = mount(<NewsTicker />);
  await screen.findByText("لا أخبار منشورة حاليًا");
  view.unmount();
  prefs.ticker_visible = false;
  mount(<NewsTicker />);
  await waitFor(() => expect(screen.queryByLabelText("الأخبار والفرص")).toBeNull());
});
it("ticker supports manual navigation pause category filter and original source", async () => {
  news = [
    {
      id: "1",
      title: "محتوى اختبار أول",
      description: "رسالة اختبار",
      category: "LIGHTHEARTED",
      published_at: "2026-10-12T08:00Z",
      source_url: "https://example.org/1",
    },
    {
      id: "2",
      title: "محتوى اختبار ثان",
      description: "آخر",
      category: "AI_TECH",
      published_at: "2026-10-12T08:00Z",
      source_url: null,
    },
  ];
  mount(<NewsTicker />);
  await screen.findByText("محتوى اختبار أول");
  expect(
    screen.getByRole("link", { name: "فتح المصدر الأصلي ↗" }).getAttribute("rel"),
  ).toBe("noopener noreferrer");
  fireEvent.click(screen.getByRole("button", { name: "إيقاف الشريط" }));
  expect(screen.getByRole("button", { name: "استئناف الشريط" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "الخبر التالي" }));
  expect(screen.getByText("محتوى اختبار ثان")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("فئة الأخبار"), {
    target: { value: "AI_TECH" },
  });
  await waitFor(() => expect(api.get).toHaveBeenCalledWith("/ticker?category=AI_TECH"));
});
it("engagement settings persist tone visibility and preferred categories", async () => {
  mount(<EngagementSettings />);
  await screen.findByLabelText("نبرة الإشعارات");
  fireEvent.change(screen.getByLabelText("نبرة الإشعارات"), {
    target: { value: "PLAYFUL" },
  });
  fireEvent.click(screen.getByLabelText("إظهار الشريط الإخباري"));
  fireEvent.click(screen.getByRole("button", { name: "حفظ تفضيلات التفاعل" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith(
      "/students/me/engagement-preferences",
      "PATCH",
      expect.objectContaining({ notification_tone: "PLAYFUL", ticker_visible: false }),
    ),
  );
});
it("dashboard uses actual streak badges and preferences from private API", async () => {
  mount(<EngagementDashboard />);
  await screen.findByText("سلسلة الاستمرارية");
  expect(screen.getByText("مجموعة إنجازاتك")).toBeTruthy();
  expect(api.get).toHaveBeenCalledWith("/students/me/streaks");
  expect(api.get).toHaveBeenCalledWith("/students/me/achievements");
});
