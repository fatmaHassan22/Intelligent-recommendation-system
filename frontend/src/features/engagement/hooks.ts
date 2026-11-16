import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../shared/api/client";

export const prefix = "/students/me";

export function useEngagement<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: ["student", "engagement", path],
    queryFn: () => api.get<{ data: T }>(prefix + path).then((r) => r.data),
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
}

export function useRefresh() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: ["student", "engagement"] }),
      client.invalidateQueries({ queryKey: ["student", "productivity"] }),
    ]);
}
