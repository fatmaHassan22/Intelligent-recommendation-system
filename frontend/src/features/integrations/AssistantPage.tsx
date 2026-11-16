import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Plus, Send, Copy, Pencil, Trash2, MessageSquare, Sparkles } from "lucide-react";
import { api, errorMessage, ApiError } from "../../shared/api/client";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Input,
  Modal,
  Notice,
  PageHeader,
  Select,
  Skeleton,
  useToast,
  iconButtonClass,
} from "../../shared/ui";
import type { AiConversation, AiDetail, AiUsage, ChatInput, MoodleStatus } from "./types";
import { integrationPrefix, useIntegration, useIntegrationRefresh } from "./hooks";
import { StudyMarkdown } from "./StudyMarkdown";

const prompts = [
  "اشرح مفهومًا صعبًا بمثال بسيط",
  "لخّص النص التالي في نقاط",
  "اصنع أسئلة تدريبية حول هذا الموضوع",
  "حوّل هذه الملاحظات إلى بطاقات مراجعة",
  "اشرح هذا الكود خطوة بخطوة",
  "ساعدني في تنظيم وقت الدراسة هذا الأسبوع",
];

function RenameConversation({
  conversation,
  onClose,
}: {
  conversation: AiConversation;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(conversation.title),
    refresh = useIntegrationRefresh(),
    toast = useToast();
  const save = useMutation({
    mutationFn: () =>
      api.mutate(integrationPrefix + "/ai/conversations/" + conversation.id, "PATCH", {
        title,
      }),
    onSuccess: async () => {
      await refresh();
      onClose();
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  return (
    <Modal className="integration-modal" title="تسمية المحادثة" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <Input
          label="عنوان المحادثة"
          required
          maxLength={120}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            إلغاء
          </Button>
          <Button type="submit" busy={save.isPending}>
            حفظ الاسم
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AssistantPage() {
  const [params, setParams] = useSearchParams(),
    selected = params.get("conversation") ?? "",
    refresh = useIntegrationRefresh(),
    toast = useToast();
  const list = useIntegration<AiConversation[]>("/ai/conversations"),
    usage = useIntegration<AiUsage>("/ai/usage"),
    detail = useIntegration<AiDetail>("/ai/conversations/" + selected, !!selected),
    moodle = useIntegration<MoodleStatus>("/moodle/status"),
    courses = useIntegration<{ course_code: string; name_ar: string }[]>(
      "/productivity/courses",
    );
  const [draft, setDraft] = useState(""),
    [mode, setMode] = useState<"STUDY" | "ACADEMIC">("STUDY"),
    [course, setCourse] = useState(""),
    [academic, setAcademic] = useState(false),
    [moodleContext, setMoodleContext] = useState(false),
    [consent, setConsent] = useState(false),
    [renaming, setRenaming] = useState<AiConversation | null>(null),
    [deleting, setDeleting] = useState<AiConversation | null>(null),
    [lastError, setLastError] = useState<unknown>(null);
  const thread = useRef<HTMLDivElement>(null);
  const current = list.data?.find((c) => String(c.id) === selected);
  useEffect(() => {
    setLastError(null);
    setDraft("");
  }, [selected]);
  useEffect(() => {
    if (thread.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [detail.data?.messages.length]);
  const create = useMutation({
    mutationFn: () =>
      api.mutate<{ data: AiConversation }>(
        integrationPrefix + "/ai/conversations",
        "POST",
        { title: "محادثة دراسية جديدة" },
      ),
    onSuccess: async (r) => {
      await refresh();
      setParams({ conversation: String(r.data.id) });
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const remove = useMutation({
    mutationFn: () =>
      api.mutate(integrationPrefix + "/ai/conversations/" + deleting!.id, "DELETE"),
    onSuccess: async () => {
      if (deleting?.id === selected) setParams({});
      setDeleting(null);
      await refresh();
      toast("حُذفت المحادثة ورسائلها.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  const send = useMutation({
    mutationFn: (body: ChatInput) =>
      api.mutate(integrationPrefix + "/ai/chat", "POST", body),
    onSuccess: async () => {
      setDraft("");
      setLastError(null);
      await refresh();
    },
    onError: async (e) => {
      setLastError(e);
      await refresh();
    },
  });
  const body = (): ChatInput => ({
    conversation_id: selected,
    request_id: crypto.randomUUID(),
    content: draft.trim(),
    mode,
    course_code: course || null,
    include_academic_context: mode === "STUDY" && academic,
    include_moodle_context: mode === "STUDY" && moodleContext,
    allow_external_context: mode === "STUDY" && consent,
  });
  const lastFailed = [...(detail.data?.messages ?? [])]
    .reverse()
    .find((m) => m.role === "USER" && m.request_status === "FAILED" && m.metadata.input);
  const unavailable = mode === "STUDY" && usage.data?.configured === false,
    needsConsent = mode === "STUDY" && (academic || moodleContext) && !consent;
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast("نُسخ الرد.");
    } catch {
      toast("تعذر النسخ؛ يمكنك تحديد النص ونسخه يدويًا.", "error");
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="فهم أعمق، وخطوة أوضح"
        title="المساعد الدراسي الذكي"
        description="شروحات ومراجعة وتدريب بالعربية والإنجليزية؛ نتائج المتطلبات من محرك القواعد، دون قرارات جامعية مولّدة."
        action={
          <Button busy={create.isPending} onClick={() => create.mutate()}>
            <Plus size={17} />
            محادثة جديدة
          </Button>
        }
      />
      {usage.error && (
        <ErrorState error={usage.error} retry={() => void usage.refetch()} />
      )}{" "}
      {usage.data && !usage.data.configured && (
        <Notice>
          <strong>Gemini غير مهيأ بعد.</strong> يمكنك حفظ المحادثات واستخدام «تحقق
          المتطلبات محليًا». الشرح المولّد يحتاج مفتاح API في الخادم، ولن نعرض ردًا مختلقًا.
        </Notice>
      )}
      <div className="study-layout">
        <aside className="surface conversation-list" aria-label="المحادثات السابقة">
          <h2>محادثاتك</h2>
          {list.error ? (
            <ErrorState error={list.error} retry={() => void list.refetch()} />
          ) : list.isPending ? (
            <Skeleton />
          ) : list.data.length ? (
            list.data.map((c) => (
              <div
                className={
                  String(c.id) === selected
                    ? "conversation-item active"
                    : "conversation-item"
                }
                key={c.id}
              >
                <button onClick={() => setParams({ conversation: String(c.id) })}>
                  <MessageSquare size={16} />
                  <span>{c.title}</span>
                </button>
                <button
                  className={iconButtonClass()}
                  aria-label={`تسمية ${c.title}`}
                  onClick={() => setRenaming(c)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  className={iconButtonClass()}
                  aria-label={`حذف ${c.title}`}
                  onClick={() => setDeleting(c)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <p className="muted">ابدأ محادثة جديدة؛ ستُحفظ رسائلك في حسابك.</p>
          )}
        </aside>
        <section className="surface study-chat" aria-label="المحادثة الدراسية">
          <div className="section-heading">
            <h2>{current?.title ?? "مساحة أسئلتك"}</h2>
            {usage.data && (
              <Badge tone="teal">
                {usage.data.remaining_today} / {usage.data.daily_limit} طلب Gemini متبقٍ
                اليوم
              </Badge>
            )}
          </div>
          {!selected ? (
            <Empty
              title="ابدأ بسؤال دراسي"
              description="أنشئ محادثة، ثم اطلب شرحًا أو تلخيصًا أو أسئلة تدريبية."
              action={
                <Button onClick={() => create.mutate()} busy={create.isPending}>
                  إنشاء محادثة
                </Button>
              }
            />
          ) : detail.error ? (
            <ErrorState error={detail.error} retry={() => void detail.refetch()} />
          ) : detail.isPending ? (
            <Skeleton />
          ) : (
            <>
              <div className="chat-messages" ref={thread} aria-label="رسائل المحادثة">
                {detail.data.messages.length ? (
                  detail.data.messages.map((m) => (
                    <article
                      className={`study-message ${m.role === "USER" ? "student-message" : "assistant-message"}`}
                      key={m.id}
                    >
                      <header>
                        <Badge
                          tone={
                            m.origin === "DETERMINISTIC"
                              ? "blue"
                              : m.role === "USER"
                                ? "neutral"
                                : "teal"
                          }
                        >
                          {m.role === "USER"
                            ? "أنت"
                            : m.origin === "DETERMINISTIC"
                              ? "من خدمات التطبيق ومحرك القواعد"
                              : "شرح مولّد من Gemini"}
                        </Badge>
                        <small>
                          {new Date(m.created_at).toLocaleTimeString("ar", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </small>
                      </header>
                      {m.role === "USER" ? (
                        <p dir="auto">{m.content}</p>
                      ) : (
                        <StudyMarkdown content={m.content} />
                      )}{" "}
                      {m.role === "USER" && m.request_status === "FAILED" && (
                        <p className="form-error">
                          {errorMessage(
                            new ApiError(m.error_code ?? "AI_PROVIDER_UNAVAILABLE", 503),
                          )}
                        </p>
                      )}
                      {m.role === "ASSISTANT" && (
                        <footer>
                          <Button variant="ghost" onClick={() => void copy(m.content)}>
                            <Copy size={14} />
                            نسخ الرد
                          </Button>
                          {m.metadata.truncated && (
                            <small>بلغ الرد حد الطول؛ يمكنك طلب متابعة محددة.</small>
                          )}
                          {m.origin === "GEMINI" && (
                            <small>قد يخطئ الشرح؛ راجع مصادر المساق.</small>
                          )}
                        </footer>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="chat-empty">ما الموضوع الذي تريد فهمه اليوم؟</p>
                )}
                {send.isPending && (
                  <div className="chat-thinking" role="status">
                    <Sparkles size={18} />
                    جارٍ تجهيز الرد…
                  </div>
                )}
              </div>
              <div className="study-prompts" aria-label="أفكار لأسئلة دراسية">
                {prompts.map((p) => (
                  <button key={p} disabled={send.isPending} onClick={() => setDraft(p)}>
                    {p}
                  </button>
                ))}
              </div>
              <form
                className="chat-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim() || send.isPending) return;
                  setLastError(null);
                  send.mutate(body());
                }}
              >
                <div className="form-two">
                  <Select
                    label="نوع المساعدة"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as typeof mode)}
                  >
                    <option value="STUDY">شرح ودراسة مع Gemini</option>
                    <option value="ACADEMIC">تحقق المتطلبات محليًا</option>
                  </Select>
                  <Select
                    label="المساق للسياق أو التحقق"
                    value={course}
                    disabled={!courses.data}
                    onChange={(e) => setCourse(e.target.value)}
                  >
                    <option value="">اختياري — دون مساق</option>
                    {courses.data?.map((c) => (
                      <option key={c.course_code} value={c.course_code}>
                        {c.course_code} · {c.name_ar}
                      </option>
                    ))}
                  </Select>
                </div>
                {courses.error && (
                  <ErrorState
                    error={courses.error}
                    retry={() => void courses.refetch()}
                  />
                )}{" "}
                {mode === "STUDY" && (
                  <details className="context-options">
                    <summary>إرفاق معلومات من حسابك (اختياري)</summary>
                    <label className="check-field">
                      <input
                        type="checkbox"
                        checked={academic}
                        onChange={(e) => {
                          setAcademic(e.target.checked);
                          setConsent(false);
                        }}
                      />
                      إرفاق بيانات المساق المحدد وتقييم متطلباته
                    </label>
                    <label className="check-field">
                      <input
                        type="checkbox"
                        checked={moodleContext}
                        disabled={moodle.data?.state !== "CONNECTED"}
                        onChange={(e) => {
                          setMoodleContext(e.target.checked);
                          setConsent(false);
                        }}
                      />
                      إرفاق عناوين ومواعيد وبيانات Moodle المتزامنة المسموح بها
                    </label>
                    <p className="helper">
                      لا تُرفق معلومات من حسابك تلقائيًا. Moodle{" "}
                      {moodle.data?.state === "CONNECTED" ? "متصل" : "غير متصل"}؛ لا تُرسل
                      ملفات أو كلمات مرور أو Tokens.
                    </p>
                    {(academic || moodleContext) && (
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                        />
                        أوافق في هذا الطلب على إرسال السياق المحدود المحدد إلى Google
                        Gemini لشرح سؤالي.
                      </label>
                    )}
                  </details>
                )}
                <div className="field">
                  <label htmlFor="study-question">رسالتك</label>
                  <textarea
                    id="study-question"
                    rows={4}
                    maxLength={4000}
                    required
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="اكتب سؤالك أو النص الذي تريد مراجعته…"
                    disabled={send.isPending}
                  />
                  <small>
                    {draft.length} / 4000 حرف ·{" "}
                    {mode === "STUDY"
                      ? "النص الذي ترسله يُشارك مع Google Gemini؛ لا تضع أسرارًا أو كلمات مرور."
                      : "هذا الطلب يُعالج محليًا ولا يُرسل إلى Gemini."}
                  </small>
                </div>
                <div className="dialog-actions">
                  <Button
                    type="submit"
                    busy={send.isPending}
                    disabled={
                      !draft.trim() || unavailable || needsConsent || usage.isPending
                    }
                  >
                    <Send size={16} />
                    {mode === "ACADEMIC" ? "تحقق محليًا" : "إرسال إلى Gemini"}
                  </Button>
                </div>
              </form>
              {lastError && (
                <p className="form-error" role="alert">
                  {errorMessage(lastError)}
                </p>
              )}
              {lastFailed && (
                <Button
                  variant="secondary"
                  disabled={send.isPending}
                  onClick={() => {
                    setLastError(null);
                    send.mutate(lastFailed.metadata.input!);
                  }}
                >
                  إعادة محاولة الرسالة الفاشلة
                </Button>
              )}
            </>
          )}
        </section>
      </div>
      <Notice>
        المساعد لا يعدّل المساقات المنجزة أو الخطط، ولا يصدر قرار تسجيل رسميًا.{" "}
        <Link to="/app/recommendations">توصية المواد</Link> و
        <Link to="/app/curriculum">تفاصيل المساقات</Link> تحتفظان بالتقييم الحتمي.
        المحادثات تُحذف تلقائيًا بعد {usage.data?.retention_days ?? 90} يومًا دون تحديث.
      </Notice>
      {renaming && (
        <RenameConversation conversation={renaming} onClose={() => setRenaming(null)} />
      )}{" "}
      {deleting && (
        <Confirm
          title="حذف المحادثة؟"
          description="ستُحذف المحادثة وجميع رسائلها نهائيًا. يبقى سجل الاستخدام المختصر لحساب حدود الاستخدام، دون نص الرسائل."
          busy={remove.isPending}
          onClose={() => setDeleting(null)}
          onConfirm={() => remove.mutate()}
        />
      )}
    </>
  );
}
