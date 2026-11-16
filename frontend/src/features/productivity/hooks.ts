import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../shared/api/client";
import type { Result } from "../../shared/api/types";
import type { NotificationPreferences, ProductivityCourse, ActiveResponse } from "./api";
import { browserTimezone } from "./time";
export const prefix = "/students/me";
export const productivityKey = ["student", "productivity"] as const;
export const activeKey = [...productivityKey, "active"] as const;
export function useProductivityQuery<T>(key: string, path: string, enabled = true) {
  return useQuery({
    queryKey: [...productivityKey, key, path],
    queryFn: () => api.get<T>(prefix + path),
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 10000,
    refetchInterval: [
      "tasks",
      "calendar",
      "pomodoro-statistics",
      "summary",
      "notifications",
    ].includes(key)
      ? 60000
      : false,
  });
}
export const usePreferences = () =>
  useProductivityQuery<Result<NotificationPreferences>>(
    "preferences",
    "/notifications/preferences",
  );
export const useTimezone = () => {
  const p = usePreferences();
  return p.data?.data.configured === false
    ? browserTimezone()
    : (p.data?.data.timezone ?? browserTimezone());
};
export const useCourses = () =>
  useProductivityQuery<Result<ProductivityCourse[]>>("courses", "/productivity/courses");
export const useActiveSession = () =>
  useQuery({
    queryKey: activeKey,
    queryFn: () => api.get<ActiveResponse>(prefix + "/pomodoro/active"),
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
export function useProductivityRefresh() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: productivityKey });
}
