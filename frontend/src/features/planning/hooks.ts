import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../shared/api/client";
import type { List } from "../../shared/api/types";
import type { AcademicTerm, Draft } from "./api";

export const prefix = "/students/me";

export function useDrafts() {
  return useQuery({
    queryKey: ["student", "semester-plans"],
    queryFn: () => api.get<List<Draft>>(`${prefix}/semester-plans`).then((r) => r.data),
  });
}

export function useTerms() {
  return useQuery({
    queryKey: ["student", "academic-terms"],
    queryFn: () =>
      api.get<List<AcademicTerm>>(`${prefix}/academic-terms`).then((r) => r.data),
  });
}

export function useRefreshPlanning() {
  const client = useQueryClient();
  return async (draft?: Draft) => {
    if (draft) client.setQueryData(["student", "draft", draft.id], draft);
    await Promise.all([
      client.invalidateQueries({ queryKey: ["student", "semester-plans"] }),
      client.invalidateQueries({ queryKey: ["student", "recommendations"] }),
    ]);
  };
}
