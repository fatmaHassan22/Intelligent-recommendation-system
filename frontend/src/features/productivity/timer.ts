import { useEffect, useState } from "react";
import type { ActiveResponse } from "./api";
import { timerRemaining } from "./time";

export const timerModeLabel = {
  FOCUS: "تركيز",
  SHORT_BREAK: "استراحة قصيرة",
  LONG_BREAK: "استراحة طويلة",
};

export function useTimerDisplay(data: ActiveResponse | undefined) {
  const [now, setNow] = useState(Date.now()),
    [offset, setOffset] = useState(0);
  useEffect(() => {
    if (data?.server_now) setOffset(Date.parse(data.server_now) - Date.now());
  }, [data?.server_now]);
  useEffect(() => {
    const tick = () => setNow(Date.now()),
      timer = setInterval(tick, 500);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
  return data?.data
    ? Math.min(data.data.duration_ms, timerRemaining(data.data, offset, now))
    : 0;
}
