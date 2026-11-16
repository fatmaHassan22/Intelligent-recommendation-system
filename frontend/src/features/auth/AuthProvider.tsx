import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  api,
  ApiError,
  resetCsrf,
  setUnauthorizedHandler,
} from "../../shared/api/client";
import type { Result, User } from "../../shared/api/types";

interface Auth {
  user: User | null | undefined;
  loading: boolean;
  error: unknown;
  refetch: () => void;
  accept: (user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

/** مفاتيح الكاش التي تبقى بعد انتهاء الجلسة (بيانات عامة لا تخص المستخدم). */
const PUBLIC_QUERY_KEYS = new Set(["auth", "majors", "plans"]);

const clearUserData = (client: QueryClient, keep: ReadonlySet<string>) => {
  void client.cancelQueries();
  client.removeQueries({ predicate: (q) => !keep.has(String(q.queryKey[0])) });
};

async function fetchSession(): Promise<User | null> {
  try {
    return (await api.get<Result<User>>("/auth/me")).data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const session = useQuery({ queryKey: ["auth"], queryFn: fetchSession, retry: false });
  const { refetch: refetchSession } = session;

  // انتهت الجلسة من الخادم (401): امسح بيانات المستخدم وأعده لحالة "غير مسجّل".
  useEffect(() => {
    setUnauthorizedHandler(() => {
      resetCsrf();
      clearUserData(client, PUBLIC_QUERY_KEYS);
      client.setQueryData(["auth"], null);
    });
    return () => setUnauthorizedHandler(() => {});
  }, [client]);

  const accept = useCallback(
    (user: User) => {
      clearUserData(client, new Set(["auth"]));
      client.setQueryData(["auth"], user);
    },
    [client],
  );

  const logout = useCallback(async () => {
    await api.mutate("/auth/logout", "POST");
    resetCsrf();
    clearUserData(client, new Set(["auth"]));
    client.setQueryData(["auth"], null);
  }, [client]);

  const value = useMemo<Auth>(
    () => ({
      user: session.data,
      loading: session.isPending,
      error: session.error,
      refetch: () => void refetchSession(),
      accept,
      logout,
    }),
    [session.data, session.isPending, session.error, refetchSession, accept, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider missing");
  return auth;
}
