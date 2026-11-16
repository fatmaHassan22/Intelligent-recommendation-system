import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Timer } from "lucide-react";
import { api } from "../../shared/api/client";
import type { Result } from "../../shared/api/types";
import { number, useToast } from "../../shared/ui";
import { prefix, productivityKey, useActiveSession, usePreferences } from "./hooks";
import { timerLabel, browserTimezone } from "./time";
import { timerModeLabel, useTimerDisplay } from "./timer";

export function ProductivityHeader() {
  const active = useActiveSession(),
    remaining = useTimerDisplay(active.data),
    toast = useToast(),
    client = useQueryClient(),
    seen = useRef(new Set<string>()),
    preferences = usePreferences(),
    initialized = useRef(false);
  const initializeZone = useMutation({
    mutationFn: () =>
      api.mutate(prefix + "/notifications/preferences", "PATCH", {
        timezone: browserTimezone(),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: productivityKey }),
  });
  useEffect(() => {
    if (preferences.data?.data.configured === false && !initialized.current) {
      initialized.current = true;
      initializeZone.mutate();
    }
  }, [preferences.data?.data.configured]);
  const unread = useQuery({
    queryKey: [...productivityKey, "unread-count"],
    queryFn: () =>
      api.get<Result<{ unread_count: number }>>(prefix + "/notifications/count"),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    const session = active.data?.data;
    if (session?.state === "COMPLETED" && !seen.current.has(session.id)) {
      seen.current.add(session.id);
      toast(
        session.mode === "FOCUS"
          ? "انتهت جلسة التركيز وحُفظت دقائقها."
          : "انتهت الاستراحة.",
      );
      void client.invalidateQueries({ queryKey: productivityKey });
    }
  }, [active.data, client, toast]);
  const session = active.data?.data,
    isActive = session && ["RUNNING", "PAUSED"].includes(session.state);
  return (
    <div className="productivity-header">
      {isActive && (
        <Link
          className="header-timer"
          to="/app/pomodoro"
          aria-label={`بومودورو: ${timerModeLabel[session.mode]} ${timerLabel(remaining)}`}
        >
          <Timer size={16} />
          <bdi>{timerLabel(remaining)}</bdi>
          {session.state === "PAUSED" && <span>متوقف</span>}
        </Link>
      )}
      <Link
        className="notification-bell"
        to="/app/notifications"
        aria-label={
          unread.error
            ? "الإشعارات، تعذر تحديث العدد"
            : unread.isPending
              ? "الإشعارات، جار تحديث العدد"
              : `الإشعارات، ${unread.data?.data.unread_count ?? 0} غير مقروءة`
        }
      >
        <Bell size={21} />
        {(unread.data?.data.unread_count ?? 0) > 0 && (
          <span>{number(unread.data!.data.unread_count)}</span>
        )}
      </Link>
    </div>
  );
}
