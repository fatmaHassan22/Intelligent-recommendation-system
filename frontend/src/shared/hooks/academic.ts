import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Profile, Major, Plan, Progress, Result, List, Course } from "../api/types";
export const useProfile = () =>
  useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => api.get<Result<Profile>>("/students/me").then((r) => r.data),
  });

export const useMajors = () =>
  useQuery({
    queryKey: ["majors"],
    queryFn: () => api.get<List<Major>>("/majors").then((r) => r.data),
  });

export const usePlans = (major: string) =>
  useQuery({
    queryKey: ["plans", major],
    queryFn: () => api.get<List<Plan>>(`/majors/${major}/plans`).then((r) => r.data),
    enabled: !!major,
  });

export const useProgress = () =>
  useQuery({
    queryKey: ["student", "progress"],
    queryFn: () => api.get<Result<Progress>>("/students/me/progress").then((r) => r.data),
  });
export const useCompleted = () =>
  useQuery({
    queryKey: ["student", "completed"],
    queryFn: () =>
      api.get<List<Course>>("/students/me/completed-courses").then((r) => r.data),
  });
export function useRefreshAcademic() {
  const client = useQueryClient();
  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["student"] }),
      client.invalidateQueries({ queryKey: ["catalog"] }),
    ]);
  };
}
