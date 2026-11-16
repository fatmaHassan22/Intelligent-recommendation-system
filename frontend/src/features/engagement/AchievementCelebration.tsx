import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import { Button, Modal, useToast } from "../../shared/ui";
import type { Achievement } from "./types";
import { prefix, useEngagement, useRefresh } from "./hooks";

export function AchievementCelebration() {
  const q = useEngagement<Achievement[]>("/achievements"),
    [current, setCurrent] = useState<Achievement | null>(null),
    seen = useRef(new Set<string>()),
    refresh = useRefresh(),
    toast = useToast();
  useEffect(() => {
    if (current) return;
    const next = q.data?.find(
      (a) => a.earned_at && !a.celebrated_at && !seen.current.has(a.code),
    );
    if (next) {
      seen.current.add(next.code);
      setCurrent(next);
    }
  }, [q.data, current]);
  const acknowledge = useMutation({
    mutationFn: () =>
      api.mutate(prefix + "/achievements/" + current!.code + "/celebrate", "POST"),
    onSuccess: async () => {
      setCurrent(null);
      await refresh();
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  return current ? (
    <Modal
      className="eng-modal"
      title="شارة جديدة!"
      onClose={() => {
        if (!acknowledge.isPending) acknowledge.mutate();
      }}
    >
      <div className="eng-celebration">
        <span className="celebration-art">
          <Trophy size={70} />
        </span>
        <h3>{current.title}</h3>
        <p>{current.description}</p>
        <Button busy={acknowledge.isPending} onClick={() => acknowledge.mutate()}>
          جميل، لنكمل!
        </Button>
      </div>
    </Modal>
  ) : null;
}
