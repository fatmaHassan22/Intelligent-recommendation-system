import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../shared/api/client";
import type { Result } from "../../shared/api/types";
import type { PersonalEvent } from "./api";
import { Button, Input, Modal, useToast } from "../../shared/ui";
import { prefix, useProductivityRefresh, useTimezone } from "./hooks";
import { addDays, dateKey, localDayStart, localToIso, localInput } from "./time";
import { CourseSelect } from "./CourseSelect";

export function EventEditor({
  event,
  day,
  onClose,
}: {
  event?: PersonalEvent;
  day: string;
  onClose: () => void;
}) {
  const currentZone = useTimezone(),
    zone = event?.timezone ?? currentZone,
    toast = useToast(),
    refresh = useProductivityRefresh();
  const [title, setTitle] = useState(event?.title ?? ""),
    [description, setDescription] = useState(event?.description ?? ""),
    [allDay, setAllDay] = useState(event?.all_day ?? false),
    [start, setStart] = useState(
      event ? localInput(event.start_at, zone) : `${day}T09:00`,
    ),
    [end, setEnd] = useState(event ? localInput(event.end_at, zone) : `${day}T10:00`),
    [startDay, setStartDay] = useState(
      event ? dateKey(new Date(event.start_at), zone) : day,
    ),
    [endDay, setEndDay] = useState(
      event?.all_day
        ? addDays(dateKey(new Date(event.end_at), zone), -1)
        : event
          ? dateKey(new Date(event.end_at), zone)
          : day,
    ),
    [course, setCourse] = useState(event?.course_code ?? ""),
    [error, setError] = useState("");
  const save = useMutation({
    mutationFn: () => {
      const start_at = allDay ? localDayStart(startDay, zone) : localToIso(start, zone),
        end_at = allDay ? localDayStart(addDays(endDay, 1), zone) : localToIso(end, zone);
      if (Date.parse(end_at) <= Date.parse(start_at))
        throw new Error("نهاية الحدث يجب أن تأتي بعد بدايته.");
      return api.mutate<Result<PersonalEvent>>(
        prefix + "/calendar/events" + (event ? "/" + event.id : ""),
        event ? "PATCH" : "POST",
        {
          title: title.trim(),
          description: description.trim() || null,
          start_at,
          end_at,
          all_day: allDay,
          timezone: zone,
          ...(!event || course !== (event.course_code ?? "")
            ? { course_code: course || null }
            : {}),
          ...(event ? { expected_revision: event.revision } : {}),
        },
      );
    },
    onSuccess: async () => {
      await refresh();
      toast("حُفظ الحدث الشخصي في التقويم.");
      onClose();
    },
    onError: (e) => {
      setError(e instanceof Error && e.name !== "ApiError" ? e.message : errorMessage(e));
      void refresh();
    },
  });
  return (
    <Modal
      title={event ? "تعديل الحدث الشخصي" : "حدث شخصي جديد"}
      onClose={() => {
        if (!save.isPending) onClose();
      }}
    >
      <form
        className="productivity-form"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          save.mutate();
        }}
      >
        <Input
          label="عنوان الحدث"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="field">
          <label htmlFor="event-description">وصف الحدث (اختياري)</label>
          <textarea
            id="event-description"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <label className="check-field">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
          />
          حدث طوال اليوم
        </label>
        <div className="form-two">
          {allDay ? (
            <>
              <Input
                label="أول يوم"
                type="date"
                required
                value={startDay}
                onChange={(e) => setStartDay(e.target.value)}
                min="2000-01-01"
                max="2199-12-31"
              />
              <Input
                label="آخر يوم (شامل)"
                type="date"
                required
                value={endDay}
                onChange={(e) => setEndDay(e.target.value)}
                min={startDay}
                max="2199-12-31"
              />
            </>
          ) : (
            <>
              <Input
                label="بداية الحدث"
                type="datetime-local"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              <Input
                label="نهاية الحدث"
                type="datetime-local"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </>
          )}
        </div>
        <p className="muted">
          الأوقات معروضة بتوقيت <bdi>{zone}</bdi>. الحدث الشخصي لا يثبت موعد امتحان أو
          محاضرة رسميًا.
        </p>
        <CourseSelect value={course} onChange={setCourse} previous={event} />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <Button
            variant="secondary"
            type="button"
            disabled={save.isPending}
            onClick={onClose}
          >
            إلغاء
          </Button>
          <Button type="submit" busy={save.isPending}>
            حفظ الحدث
          </Button>
        </div>
      </form>
    </Modal>
  );
}
