import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../shared/api/client";
import type { PomodoroSettings } from "./api";
import { Button, Input, Modal, Notice, useToast } from "../../shared/ui";
import { prefix, useProductivityRefresh } from "./hooks";

export function SettingsEditor({
  settings,
  onClose,
}: {
  settings: PomodoroSettings;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(settings),
    refresh = useProductivityRefresh(),
    toast = useToast();
  const save = useMutation({
    mutationFn: () => api.mutate(prefix + "/pomodoro/settings", "PATCH", draft),
    onSuccess: async () => {
      await refresh();
      toast("حُفظت إعدادات بومودورو.");
      onClose();
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  return (
    <Modal
      title="إعدادات بومودورو"
      onClose={() => {
        if (!save.isPending) onClose();
      }}
    >
      <form
        className="productivity-form"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {(
          [
            ["focus_minutes", "مدة التركيز بالدقائق", 180],
            ["short_break_minutes", "الاستراحة القصيرة بالدقائق", 60],
            ["long_break_minutes", "الاستراحة الطويلة بالدقائق", 120],
            ["long_break_after", "استراحة طويلة بعد كم جلسة تركيز؟", 12],
          ] as const
        ).map(([key, label, max]) => (
          <Input
            key={key}
            label={label}
            type="number"
            min={1}
            max={max}
            required
            value={draft[key]}
            onChange={(e) => setDraft({ ...draft, [key]: Number(e.target.value) })}
          />
        ))}
        <Notice>
          الإعدادات الجديدة تطبق على الجلسات القادمة؛ مدة الجلسة المحفوظة حاليًا لا تتغير.
        </Notice>
        <div className="dialog-actions">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={save.isPending}
          >
            إلغاء
          </Button>
          <Button type="submit" busy={save.isPending}>
            حفظ الإعدادات
          </Button>
        </div>
      </form>
    </Modal>
  );
}
