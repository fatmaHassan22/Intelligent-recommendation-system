export class ApiError extends Error { constructor(public code: string, public status: number, public fields?: { path: string; code: string }[]) { super(code); } }
const messages: Record<string, string> = { SEMESTER_PLAN_NOT_FOUND: 'المسودة غير موجودة أو غير متاحة لحسابك.', ACADEMIC_TERM_NOT_FOUND: 'الفصل المختار غير موجود في السجلات.', PLAN_REVISION_CONFLICT: 'تغيرت المسودة منذ فتحها. حدّثي الصفحة وراجعي التعديلات ثم حاولي مجددًا.', COURSE_ALREADY_COMPLETED: 'هذا المساق منجز في خطة المسودة ولا يمكن إضافته كغير منجز.', COURSE_ALREADY_SELECTED: 'المساق موجود بالفعل في هذه المسودة.', PLAN_COURSE_NOT_FOUND: 'المساق غير موجود في المسودة.', INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.', DUPLICATE_RECORD: 'هذه البيانات مسجلة مسبقًا. تحققي من البريد أو رقم الطالب أو إنجاز المساق.', AUTH_RATE_LIMITED: 'محاولات كثيرة. انتظري قليلًا ثم حاولي مجددًا.', RATE_LIMITED: 'طلبات كثيرة، حاولي بعد قليل.', AUTH_REQUIRED: 'انتهت الجلسة. سجّلي الدخول للمتابعة.', CSRF_INVALID: 'تغيرت جلسة الحماية. حاولي إرسال الطلب مرة أخرى.', INVALID_CURRICULUM_SELECTION: 'الخطة لا تتبع التخصص المختار.', PLAN_CHANGE_CONFIRMATION_REQUIRED: 'تغيير الخطة يحتاج موافقتك الصريحة.', COURSE_NOT_IN_SELECTED_PLAN: 'هذا المساق ليس ضمن خطتك الحالية.', COURSE_NOT_IN_PLAN: 'هذا المساق غير موجود في الخطة المختارة.', FORBIDDEN: 'هذا القسم متاح للحسابات الطلابية فقط.', NETWORK_ERROR: 'تعذر الاتصال بالخادم. تحققي من تشغيله واتصالك ثم حاولي مجددًا.', VALIDATION_ERROR: 'بعض الحقول غير صحيحة. راجعي البيانات المدخلة.', NOT_FOUND: 'المحتوى المطلوب غير موجود.', INTERNAL_ERROR: 'تعذر إتمام الطلب. حاولي مجددًا لاحقًا.' };
Object.assign(messages, { TASK_NOT_FOUND: 'المهمة غير موجودة في حسابك.', EVENT_NOT_FOUND: 'الحدث غير موجود في حسابك.', NOTIFICATION_NOT_FOUND: 'الإشعار غير موجود أو أُخفي سابقًا.', PRODUCTIVITY_REVISION_CONFLICT: 'تغير هذا العنصر من صفحة أخرى. حدّثي البيانات ثم أعيدي التعديل.', INVALID_TIMEZONE: 'اسم المنطقة الزمنية غير صالح؛ استخدمي مثل Asia/Hebron أو UTC.', INVALID_LOCAL_TIME: 'هذا الوقت المحلي غير موجود بسبب تغيير التوقيت؛ اختاري وقتًا آخر.', INVALID_DATE: 'التاريخ غير صالح.', POMODORO_NOT_FOUND: 'جلسة بومودورو غير موجودة في حسابك.', POMODORO_ALREADY_ACTIVE: 'لديك جلسة نشطة أو متوقفة. استأنفيها أو ألغِيها قبل بدء أخرى.', POMODORO_NOT_FINISHED: 'موعد نهاية الجلسة لم يحن في الخادم بعد؛ حدّثي المؤقت.', POMODORO_INVALID_STATE: 'حالة الجلسة تغيّرت. حدّثي المؤقت للمتابعة.', POMODORO_ASSOCIATION_MISMATCH: 'المساق المختار لا يطابق المساق المرتبط بالمهمة.' });
export const errorMessage = (error: unknown) => error instanceof ApiError ? (messages[error.code] ?? 'تعذر إتمام العملية. حاولي مجددًا.') : 'حدث خطأ غير متوقع. حاولي مجددًا.';
const base = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '');
let csrf: string | null = null, csrfPending: Promise<string> | null = null;
let unauthorized: () => void = () => { };
export const setUnauthorizedHandler = (fn: () => void) => { unauthorized = fn; };
export const resetCsrf = () => { csrf = null; csrfPending = null; };
async function send<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response: Response;
    try { response = await fetch(base + path, { ...options, credentials: 'include', headers: { Accept: 'application/json', ...options.headers } }); } catch { throw new ApiError('NETWORK_ERROR', 0); }
    if (response.status === 204) return undefined as T;
    let payload: unknown; try { payload = await response.json(); } catch { throw new ApiError('INTERNAL_ERROR', response.status); }
    const body = payload as { error?: { code?: string; fields?: { path: string; code: string }[] }; csrf_token?: string };
    if (!response.ok) { if (response.status === 401 && !path.startsWith('/auth/login')) unauthorized(); throw new ApiError(body.error?.code ?? 'INTERNAL_ERROR', response.status, body.error?.fields); }
    if (body.csrf_token) csrf = body.csrf_token; return payload as T;
}
export async function csrfToken() {
    if (csrf) return csrf;
    if (!csrfPending) csrfPending = send<{ csrf_token: string }>('/auth/csrf').then(r => { csrf = r.csrf_token; return csrf; }).finally(() => { csrfPending = null; });
    return csrfPending;
}
export const api = {
    get: <T,>(path: string, signal?: AbortSignal) => send<T>(path, { signal }),
    async mutate<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
        const token = await csrfToken();
        try { return await send<T>(path, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
        catch (error) { if (error instanceof ApiError && error.code === 'CSRF_INVALID') resetCsrf(); throw error; }
    }
};


Object.assign(messages, { AI_NOT_CONFIGURED: 'Gemini غير مهيأ في الخادم. يمكنك استخدام التحقق المحلي من المتطلبات.', AI_CONVERSATION_NOT_FOUND: 'المحادثة غير موجودة أو ليست لحسابك.', AI_REQUEST_BUSY: 'يوجد طلب قيد التنفيذ؛ انتظري انتهاءه قبل المحاولة.', AI_REQUEST_REUSED: 'معرّف الطلب استُخدم لرسالة أخرى؛ ابدئي طلبًا جديدًا.', AI_CONTEXT_CONSENT_REQUIRED: 'إرسال سياق من حسابك إلى Gemini يحتاج موافقتك الصريحة لهذا الطلب.', AI_DAILY_LIMIT: 'وصلتِ إلى حد الاستخدام اليومي. التحقق الأكاديمي المحلي ما زال متاحًا.', AI_RATE_LIMIT: 'انتظري قليلًا بين الرسائل لتجنب الطلبات المتتابعة.', AI_CAPACITY_LIMIT: 'المساعد يعالج طلبات أخرى الآن؛ حاولي بعد قليل.', AI_PROVIDER_QUOTA: 'وصلت خدمة Gemini إلى حد الحصة أو المعدل؛ حاولي لاحقًا.', AI_CREDENTIALS_REJECTED: 'تعذر استخدام مفتاح Gemini؛ يحتاج المسؤول التحقق من الإعداد.', AI_PROVIDER_UNAVAILABLE: 'تعذر الاتصال بـGemini؛ رسالتك محفوظة ويمكن إعادة محاولتها.', AI_TIMEOUT: 'استغرق الرد وقتًا أطول من المسموح؛ يمكنك إعادة محاولة الرسالة بأمان.', AI_EMPTY_RESPONSE: 'لم يصل نص صالح من Gemini؛ يمكنك إعادة المحاولة.', AI_RETRY_LIMIT: 'بلغت الرسالة حد إعادة المحاولة؛ ابدئي سؤالًا جديدًا بعد التحقق من السبب.', AI_CONVERSATION_FULL: 'المحادثة بلغت حد الرسائل؛ ابدئي محادثة جديدة.', AI_CONVERSATION_LIMIT: 'لديك 50 محادثة؛ احذفي محادثة قديمة قبل إنشاء أخرى.', MOODLE_NOT_CONFIGURED: 'الربط المؤسسي غير مهيأ لحسابك؛ لا حاجة لإدخال كلمة مرور Moodle.', MOODLE_AUTHENTICATION_FAILED: 'رفض Moodle التصريح أو انتهت صلاحيته؛ راجعي مسؤول الربط.', MOODLE_PERMISSION_DENIED: 'التصريح لا يسمح بوظائف المزامنة المطلوبة؛ راجعي المسؤول.', MOODLE_SYNC_ERROR: 'تعذرت مزامنة Moodle؛ بقيت مهامك وأحداثك الشخصية محفوظة.', MOODLE_SYNC_BUSY: 'توجد مزامنة قيد التنفيذ؛ لا نبدأ مزامنتين متداخلتين.', MOODLE_SYNC_RATE_LIMIT: 'انتظري 30 ثانية على الأقل قبل تكرار المزامنة اليدوية.', MOODLE_TOKEN_UNAVAILABLE: 'تعذر فتح التصريح المشفر؛ يحتاج المسؤول التحقق من مفتاح الخادم.', MOODLE_IDENTITY_CHANGED: 'هوية التصريح تغيرت؛ يلزم إعادة الربط بواسطة المسؤول.', MOODLE_PARTIAL_RESPONSE: 'وصلت بيانات جزئية من Moodle؛ لم نستبدل آخر نسخة ناجحة.', MOODLE_INVALID_RESPONSE: 'رد المؤسسة لا يطابق الصيغة المدعومة؛ راجعي إعداد وظائف Moodle.', MOODLE_SYNC_LIMIT: 'تجاوزت المزامنة حدود الحجم؛ يحتاج المسؤول مراجعة نطاق الخدمة.', MOODLE_TIMEOUT: 'انتهت مهلة مزامنة Moodle؛ حاولي لاحقًا.' });

Object.assign(messages, { AI_INTERRUPTED: 'توقّف الطلب السابق قبل اكتماله؛ يمكنك إعادة محاولته بأمان.', MOODLE_INTERRUPTED: 'توقفت المزامنة السابقة؛ يمكنك محاولة مزامنة جديدة.' });
