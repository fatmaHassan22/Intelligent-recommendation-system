import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { api } from "../../shared/api/client";
import { Badge, Button, Empty, ErrorState, Select, Skeleton } from "../../shared/ui";
import type { EngagementPreferences, News } from "./types";
import { categoryLabels } from "./constants";
import { useEngagement } from "./hooks";

export function NewsTicker() {
  const prefs = useEngagement<EngagementPreferences>("/engagement-preferences"),
    [category, setCategory] = useState(""),
    [index, setIndex] = useState(0),
    [paused, setPaused] = useState(
      () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    );
  const q = useQuery({
    queryKey: ["ticker", category],
    queryFn: () =>
      api
        .get<{ data: News[] }>("/ticker" + (category ? "?category=" + category : ""))
        .then((r) => r.data),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    enabled: prefs.data?.ticker_visible !== false,
  });
  const allowed =
    q.data?.filter((n) => prefs.data?.ticker_categories.includes(n.category)) ?? [];
  const item = allowed[index % Math.max(allowed.length, 1)];
  useEffect(() => {
    if (paused || allowed.length < 2) return;
    const timer = setInterval(() => setIndex((i) => i + 1), 8000);
    return () => clearInterval(timer);
  }, [paused, allowed.length]);
  if (prefs.data?.ticker_visible === false) return null;
  return (
    <section className="surface news-ticker" aria-label="الأخبار والفرص">
      <div className="section-heading">
        <h2>نافذة الأخبار والفرص</h2>
        <Select
          label="فئة الأخبار"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setIndex(0);
          }}
        >
          <option value="">كل الفئات المفضلة</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </div>
      {q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.isPending || prefs.isPending ? (
        <Skeleton />
      ) : prefs.error ? (
        <ErrorState error={prefs.error} retry={() => void prefs.refetch()} />
      ) : item ? (
        <>
          <article key={item.id} className="ticker-content">
            <Badge tone="teal">{categoryLabels[item.category]}</Badge>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <small>{new Date(item.published_at).toLocaleDateString("ar")}</small>
            {item.source_url && (
              <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                فتح المصدر الأصلي ↗
              </a>
            )}
          </article>
          <div className="ticker-controls">
            <Button
              variant="secondary"
              aria-label="الخبر السابق"
              disabled={allowed.length < 2}
              onClick={() => setIndex((i) => (i - 1 + allowed.length) % allowed.length)}
            >
              <ChevronRight size={17} />
            </Button>
            <Button variant="secondary" onClick={() => setPaused(!paused)}>
              {paused ? <Play size={16} /> : <Pause size={16} />}{" "}
              {paused ? "استئناف الشريط" : "إيقاف الشريط"}
            </Button>
            <span>
              {(index % allowed.length) + 1} / {allowed.length}
            </span>
            <Button
              variant="secondary"
              aria-label="الخبر التالي"
              disabled={allowed.length < 2}
              onClick={() => setIndex((i) => i + 1)}
            >
              <ChevronLeft size={17} />
            </Button>
          </div>
        </>
      ) : (
        <Empty
          title="لا أخبار منشورة حاليًا"
          description="ستظهر هنا الأخبار والفرص التي يضيفها المسؤول ضمن الفئات المفضلة لديك، بعد نشرها وقبل انتهاء صلاحيتها."
        />
      )}
    </section>
  );
}
