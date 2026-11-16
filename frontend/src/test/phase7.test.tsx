import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api, ApiError } from "../shared/api/client";
import { ToastProvider } from "../shared/ui";
import { AssistantPage } from "../features/integrations/AssistantPage";
import { StudyMarkdown } from "../features/integrations/StudyMarkdown";
import { MoodlePage } from "../features/integrations/Moodle";
import { CalendarPage } from "../features/productivity/CalendarPage";
let conversations: any[], messages: any[], usage: any, moodle: any, items: any[];
const clients: QueryClient[] = [];
beforeEach(() => {
  conversations = [
    {
      id: "1",
      title: "مراجعة البرمجة",
      created_at: "2026-10-14T08:00Z",
      updated_at: "2026-10-14T08:00Z",
    },
  ];
  messages = [];
  usage = {
    configured: true,
    model: "test-model",
    daily_limit: 20,
    used_today: 0,
    remaining_today: 20,
    max_input_characters: 4000,
    max_output_tokens: 1024,
    retention_days: 90,
    quota_timezone: "UTC",
    academic_rules_available: true,
  };
  moodle = {
    state: "NOT_CONFIGURED",
    can_sync: false,
    automatic_sync: false,
    notifications_enabled: true,
    last_success_at: null,
    last_attempt_at: null,
    capabilities: [],
    error_code: null,
  };
  items = [];
  vi.spyOn(api, "get").mockImplementation(async (path: string) => {
    if (path === "/students/me/ai/conversations") return { data: conversations } as any;
    if (path.includes("/ai/conversations/"))
      return { data: { id: "1", title: "مراجعة البرمجة", messages } } as any;
    if (path.endsWith("/ai/usage")) return { data: usage } as any;
    if (path.endsWith("/moodle/status")) return { data: moodle } as any;
    if (path.endsWith("/moodle/courses")) return { data: [] } as any;
    if (path.endsWith("/moodle/events")) return { data: items } as any;
    if (path.endsWith("/moodle/history")) return { data: [] } as any;
    if (path.endsWith("/productivity/courses"))
      return { data: [{ course_code: "ITCS1311", name_ar: "رياضيات للحاسوب" }] } as any;
    if (path.endsWith("/notifications/preferences"))
      return { data: { timezone: "UTC", configured: true } } as any;
    if (path.includes("/calendar?"))
      return { data: { tasks: [], events: [], moodle_events: items } } as any;
    throw new Error("Unexpected test route " + path);
  });
  vi.spyOn(api, "mutate").mockImplementation(
    async (path: string, method: string, body: any) => {
      if (path.endsWith("/ai/chat")) {
        messages = [
          ...messages,
          {
            id: "1",
            role: "USER",
            content: body.content,
            origin: "STUDENT",
            request_status: "COMPLETED",
            created_at: "2026-10-14T08:00Z",
            metadata: {},
          },
          {
            id: "2",
            role: "ASSISTANT",
            content: "**شرح اختبار فقط**",
            origin: body.mode === "ACADEMIC" ? "DETERMINISTIC" : "GEMINI",
            created_at: "2026-10-14T08:00Z",
            metadata: {},
          },
        ];
        return { data: { messages, usage } } as any;
      }
      if (path.endsWith("/ai/conversations") && method === "POST") {
        conversations.push({ id: "2", title: body.title });
        return { data: conversations.at(-1) } as any;
      }
      if (path.includes("/ai/conversations/") && method === "PATCH") {
        conversations[0].title = body.title;
        return undefined as any;
      }
      if (path.includes("/ai/conversations/") && method === "DELETE") {
        conversations = [];
        return undefined as any;
      }
      if (path.endsWith("/moodle/sync")) {
        moodle.state = "CONNECTED";
        return { data: {} } as any;
      }
      return { data: {} } as any;
    },
  );
});
afterEach(() => {
  clients.forEach((c) => c.clear());
  clients.length = 0;
  vi.restoreAllMocks();
});
function mount(node: React.ReactNode, url = "/app/assistant?conversation=1") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[url]}>
        <ToastProvider>{node}</ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
it("renders Markdown and code without scripts unsafe links raw HTML or remote images", () => {
  mount(
    <StudyMarkdown
      content={
        '**تعلم**\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n<img src="x" onerror="alert(1)">\n\n![remote](https://tracker.test/pixel)\n\n```js\nconst x = 1;\n```'
      }
    />,
  );
  expect(document.querySelector("script")).toBeNull();
  expect(document.querySelector("img")).toBeNull();
  expect(document.querySelector("a")?.getAttribute("href") ?? "").not.toContain(
    "javascript:",
  );
  expect(document.querySelector("pre")?.getAttribute("dir")).toBe("ltr");
  expect(screen.getByText("const x = 1;")).toBeTruthy();
});
it("shows real unconfigured Gemini state while local rule checking remains available", async () => {
  usage.configured = false;
  mount(<AssistantPage />);
  await screen.findByText("Gemini غير مهيأ بعد.");
  fireEvent.change(screen.getByLabelText("رسالتك"), {
    target: { value: "تحقق متطلبات المساق" },
  });
  expect(
    (screen.getByRole("button", { name: "إرسال إلى Gemini" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("نوع المساعدة"), {
    target: { value: "ACADEMIC" },
  });
  fireEvent.change(screen.getByLabelText("المساق للسياق أو التحقق"), {
    target: { value: "ITCS1311" },
  });
  fireEvent.click(screen.getByRole("button", { name: "تحقق محليًا" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith(
      "/students/me/ai/chat",
      "POST",
      expect.objectContaining({
        mode: "ACADEMIC",
        course_code: "ITCS1311",
        include_moodle_context: false,
        allow_external_context: false,
      }),
    ),
  );
  await screen.findByText("من خدمات التطبيق ومحرك القواعد");
});
it("sends one real chat payload then renders stored response and copy control", async () => {
  mount(<AssistantPage />);
  await screen.findByLabelText("رسالتك");
  fireEvent.change(screen.getByLabelText("رسالتك"), {
    target: { value: "اشرح الاستدعاء الذاتي" },
  });
  fireEvent.click(screen.getByRole("button", { name: "إرسال إلى Gemini" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith(
      "/students/me/ai/chat",
      "POST",
      expect.objectContaining({
        conversation_id: "1",
        content: "اشرح الاستدعاء الذاتي",
        request_id: expect.any(String),
      }),
    ),
  );
  await screen.findByText("شرح اختبار فقط");
  expect(screen.getByRole("button", { name: "نسخ الرد" })).toBeTruthy();
});
it("context is opt-in and requires consent before sending private source information", async () => {
  moodle.state = "CONNECTED";
  mount(<AssistantPage />);
  await screen.findByLabelText("رسالتك");
  fireEvent.click(screen.getByText("إرفاق معلومات من حسابك (اختياري)"));
  fireEvent.click(screen.getByLabelText("إرفاق بيانات المساق المحدد وتقييم متطلباته"));
  fireEvent.change(screen.getByLabelText("رسالتك"), {
    target: { value: "اشرح هذا المساق" },
  });
  expect(
    (screen.getByRole("button", { name: "إرسال إلى Gemini" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  fireEvent.click(
    screen.getByLabelText(
      "أوافق في هذا الطلب على إرسال السياق المحدود المحدد إلى Google Gemini لشرح سؤالي.",
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "إرسال إلى Gemini" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith(
      "/students/me/ai/chat",
      "POST",
      expect.objectContaining({
        include_academic_context: true,
        allow_external_context: true,
        include_moodle_context: false,
      }),
    ),
  );
});
it("failed-message retry preserves request identifier and content rather than making duplicate turns", async () => {
  const input = {
    conversation_id: "1",
    request_id: "retry-test-request",
    content: "اشرح الموضوع",
    mode: "STUDY",
    course_code: null,
    include_academic_context: false,
    include_moodle_context: false,
    allow_external_context: false,
  };
  messages = [
    {
      id: "5",
      role: "USER",
      content: input.content,
      origin: "STUDENT",
      request_status: "FAILED",
      error_code: "AI_TIMEOUT",
      created_at: "2026-10-14T08:00Z",
      metadata: { input },
    },
  ];
  mount(<AssistantPage />);
  await screen.findByRole("button", { name: "إعادة محاولة الرسالة الفاشلة" });
  fireEvent.click(screen.getByRole("button", { name: "إعادة محاولة الرسالة الفاشلة" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith("/students/me/ai/chat", "POST", input),
  );
});
it("conversation rename and creation use authenticated persistence endpoints", async () => {
  mount(<AssistantPage />);
  await screen.findByRole("button", { name: "تسمية مراجعة البرمجة" });
  fireEvent.click(screen.getByRole("button", { name: "تسمية مراجعة البرمجة" }));
  fireEvent.change(screen.getByLabelText("عنوان المحادثة"), {
    target: { value: "مراجعة الخوارزميات" },
  });
  fireEvent.click(screen.getByRole("button", { name: "حفظ الاسم" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith("/students/me/ai/conversations/1", "PATCH", {
      title: "مراجعة الخوارزميات",
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "محادثة جديدة" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith("/students/me/ai/conversations", "POST", {
      title: "محادثة دراسية جديدة",
    }),
  );
});
it("provider failure displays friendly quota error without inventing an assistant reply", async () => {
  vi.mocked(api.mutate).mockRejectedValue(new ApiError("AI_PROVIDER_QUOTA", 429));
  mount(<AssistantPage />);
  await screen.findByLabelText("رسالتك");
  fireEvent.change(screen.getByLabelText("رسالتك"), { target: { value: "سؤال دراسي" } });
  fireEvent.click(screen.getByRole("button", { name: "إرسال إلى Gemini" }));
  await screen.findByRole("alert");
  expect(screen.queryByText("شرح مولّد من Gemini")).toBeNull();
});
it("Moodle unconfigured page has no fake data password fields or enabled sync", async () => {
  mount(<MoodlePage />, "/app/moodle");
  await screen.findByText("الربط الجامعي غير متاح بعد");
  expect(
    (screen.getByRole("button", { name: "مزامنة الآن" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(document.querySelector('input[type="password"]')).toBeNull();
  expect(screen.getByText("لا مساقات Moodle متاحة")).toBeTruthy();
});
it("Moodle metadata renders as text and manual sync uses guarded backend endpoint", async () => {
  moodle = {
    ...moodle,
    state: "CONNECTED",
    can_sync: true,
    last_success_at: "2026-10-14T08:00Z",
  };
  items = [
    {
      id: "10",
      title: "واجب المراجعة",
      kind: "ASSIGNMENT",
      description: "<script>doNotRun()</script>",
      course_name: "برمجة",
      due_at: "2026-10-15T10:00Z",
      source_url: "https://moodle.example.test/assignment",
      metadata: {},
    },
  ];
  mount(<MoodlePage />, "/app/moodle");
  await screen.findByText("واجب المراجعة");
  expect(document.querySelector("script")).toBeNull();
  expect(screen.getByText("<script>doNotRun()</script>")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "مزامنة الآن" }));
  await waitFor(() =>
    expect(api.mutate).toHaveBeenCalledWith("/students/me/moodle/sync", "POST"),
  );
});
it("calendar projects Moodle deadlines as read-only source links distinct from student events", async () => {
  const tomorrow = new Date();
  const stamp = new Date(
    Date.UTC(
      tomorrow.getUTCFullYear(),
      tomorrow.getUTCMonth(),
      tomorrow.getUTCDate(),
      12,
    ),
  ).toISOString();
  items = [
    {
      id: "9",
      kind: "QUIZ",
      title: "موعد اختبار من Moodle",
      description: "",
      course_name: "برمجة",
      due_at: stamp,
      source: "MOODLE",
    },
  ];
  mount(<CalendarPage />, "/app/calendar");
  await waitFor(() =>
    expect(screen.getAllByText("موعد اختبار من Moodle").length).toBeGreaterThan(0),
  );
  const links = screen.getAllByRole("link", { name: /موعد اختبار من Moodle/ });
  expect(links[0].getAttribute("href")).toBe("/app/moodle?item=9");
  expect(screen.queryByRole("button", { name: /حذف.*Moodle/ })).toBeNull();
});
