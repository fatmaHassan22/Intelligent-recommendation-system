import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../shared/api/client";
import {
  Button,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  useToast,
} from "../../shared/ui";
import type { Avatar } from "./types";
import { prefix, useEngagement, useRefresh } from "./hooks";
import { AvatarSvg } from "./AvatarSvg";
import { initialAvatar } from "./constants";

export function AvatarEditor({ value }: { value: Avatar }) {
  const [draft, setDraft] = useState(value),
    refresh = useRefresh(),
    toast = useToast();
  const save = useMutation({
    mutationFn: () => api.mutate(prefix + "/avatar", "PATCH", draft),
    onSuccess: async () => {
      await refresh();
      toast("حُفظ أفاتارك.");
    },
    onError: (e) => toast(errorMessage(e), "error"),
  });
  return (
    <section className="surface avatar-editor">
      <div className="avatar-preview">
        <AvatarSvg value={draft} size={150} />
        <h2>هذه معاينتك</h2>
        <small>تظهر التغييرات في حسابك بعد الحفظ.</small>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="form-two">
          <Select
            label="أسلوب الأفاتار"
            value={draft.style}
            onChange={(e) =>
              setDraft({ ...draft, style: e.target.value as Avatar["style"] })
            }
          >
            <option value="STUDENT">طالب</option>
            <option value="CAT">قطة</option>
            <option value="ROBOT">روبوت</option>
          </Select>
          <Select
            label="العينان"
            value={draft.eyes}
            onChange={(e) =>
              setDraft({ ...draft, eyes: e.target.value as Avatar["eyes"] })
            }
          >
            <option value="ROUND">هادئتان</option>
            <option value="HAPPY">مبتسمتان</option>
          </Select>
          <Input
            label="لون الأفاتار"
            type="color"
            value={draft.color}
            onChange={(e) => setDraft({ ...draft, color: e.target.value })}
          />
          <Input
            label="لون الخلفية"
            type="color"
            value={draft.background}
            onChange={(e) => setDraft({ ...draft, background: e.target.value })}
          />
          <Select
            label="الإضافة"
            value={draft.accessory}
            onChange={(e) =>
              setDraft({ ...draft, accessory: e.target.value as Avatar["accessory"] })
            }
          >
            <option value="NONE">دون إضافة</option>
            <option value="GLASSES">نظارات</option>
            <option value="CAP">قبعة تخرج</option>
          </Select>
        </div>
        <div className="dialog-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setDraft({ ...initialAvatar })}
          >
            إعادة المعاينة للافتراضي
          </Button>
          <Button type="submit" busy={save.isPending}>
            حفظ الأفاتار
          </Button>
        </div>
        {save.error && (
          <p role="alert" className="form-error">
            {errorMessage(save.error)}
          </p>
        )}
      </form>
    </section>
  );
}

export function AvatarPage() {
  const q = useEngagement<Avatar>("/avatar");
  return (
    <>
      <PageHeader
        eyebrow="شخصية تشبه أسلوبك"
        title="الأفاتار"
        description="اختر الشكل والألوان، وعاين النتيجة قبل حفظها."
      />
      {q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.isPending ? (
        <Skeleton />
      ) : (
        <AvatarEditor key={JSON.stringify(q.data)} value={q.data} />
      )}
    </>
  );
}
