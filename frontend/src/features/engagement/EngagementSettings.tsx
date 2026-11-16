import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Flame, Trophy, Palette } from "lucide-react";
import { api, errorMessage } from "../../shared/api/client";
import {
  Button,
  ErrorState,
  Input,
  Notice,
  Select,
  Skeleton,
  useToast,
} from "../../shared/ui";
import type { EngagementPreferences } from "./types";
import { categoryLabels } from "./constants";
import { prefix, useEngagement, useRefresh } from "./hooks";

function PreferencesForm({ value }: { value: EngagementPreferences }) {
  const [draft, setDraft] = useState(value),
    refresh = useRefresh(),
    toast = useToast();
  const save = useMutation({
    mutationFn: () => api.mutate(prefix + "/engagement-preferences", "PATCH", draft),
    onSuccess: async () => {
      await refresh();
      toast("حُفظت تفضيلات التفاعل.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  return (
    <form
      className="surface engagement-preferences"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <h2>تفضيلات التفاعل</h2>
      <Select
        label="نبرة الإشعارات"
        value={draft.notification_tone}
        onChange={(e) =>
          setDraft({
            ...draft,
            notification_tone: e.target
              .value as EngagementPreferences["notification_tone"],
          })
        }
      >
        <option value="PROFESSIONAL">مهنية — تعطيل الرسائل المرحة</option>
        <option value="PLAYFUL">مرحة ولطيفة</option>
      </Select>
      <Input
        label="منطقة توقيت الاستمرارية"
        value={draft.timezone}
        required
        onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
      />
      <label className="check-field">
        <input
          type="checkbox"
          checked={draft.achievement_notifications}
          onChange={(e) =>
            setDraft({ ...draft, achievement_notifications: e.target.checked })
          }
        />
        إشعارات الشارات ومحطات الاستمرارية
      </label>
      <label className="check-field">
        <input
          type="checkbox"
          checked={draft.ticker_visible}
          onChange={(e) => setDraft({ ...draft, ticker_visible: e.target.checked })}
        />
        إظهار الشريط الإخباري
      </label>
      <fieldset>
        <legend>فئات الأخبار المفضلة</legend>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <label className="check-field" key={key}>
            <input
              type="checkbox"
              checked={draft.ticker_categories.includes(key)}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  ticker_categories: e.target.checked
                    ? [...draft.ticker_categories, key]
                    : draft.ticker_categories.filter((k) => k !== key),
                })
              }
            />
            {label}
          </label>
        ))}
      </fieldset>
      <Notice>
        اختيار النبرة لا يزيد عدد التذكيرات ولا يفعّل الأنواع التي عطّلتها في مركز
        الإشعارات. تغيير توقيت الاستمرارية يخص الأنشطة التالية، ولا يعيد كتابة الأيام
        السابقة.
      </Notice>
      {save.error && (
        <p role="alert" className="form-error">
          {errorMessage(save.error)}
        </p>
      )}
      <Button busy={save.isPending} type="submit">
        حفظ تفضيلات التفاعل
      </Button>
    </form>
  );
}

export function EngagementSettings() {
  const q = useEngagement<EngagementPreferences>("/engagement-preferences");
  return (
    <>
      <div className="eng-settings-links">
        <Link to="/app/avatar">
          <Palette size={19} /> تخصيص الأفاتار
        </Link>
        <Link to="/app/streaks">
          <Flame size={19} /> الاستمرارية
        </Link>
        <Link to="/app/achievements">
          <Trophy size={19} /> الشارات
        </Link>
      </div>
      {q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.isPending ? (
        <Skeleton />
      ) : (
        <PreferencesForm key={JSON.stringify(q.data)} value={q.data} />
      )}
    </>
  );
}
