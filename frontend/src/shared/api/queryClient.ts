import { QueryClient, MutationCache } from "@tanstack/react-query";
import { ApiError } from "./client";

const STALE_TIME_MS = 30_000;

/** لا نعيد المحاولة عند أخطاء العميل (4xx)، ونعيد مرة واحدة فقط لأخطاء الشبكة/الخادم. */
const shouldRetry = (count: number, error: unknown) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1;

export const queryClient: QueryClient = new QueryClient({
  mutationCache: new MutationCache({
    // أي عملية كتابة قد تغيّر الإنجازات، لذلك نحدّث بيانات التفاعل بعدها.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["student", "engagement"] });
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});
