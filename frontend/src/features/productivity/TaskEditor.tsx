import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, errorMessage } from "../../shared/api/client";
import type { Result } from "../../shared/api/types";
import type { Task, Priority, TaskStatus } from "./api";
import { Button, Input, Modal, Select, useToast } from "../../shared/ui";
import { prefix, useProductivityRefresh, useTimezone } from "./hooks";
import { priorityLabel, statusLabel } from "./labels";
import { CourseSelect } from "./CourseSelect";

export function TaskEditor({
  task,
  day,
  onClose,
}: {
  task?: Task;
  day?: string;
  onClose: () => void;
}) {
  const timezone = useTimezone(),
    refresh = useProductivityRefresh(),
    toast = useToast();
  const [title, setTitle] = useState(task?.title ?? ""),
    [description, setDescription] = useState(task?.description ?? ""),
    [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM"),
    [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO"),
    [due, setDue] = useState(task?.due_date ?? day ?? ""),
    [time, setTime] = useState(task?.due_time ?? ""),
    [zone, setZone] = useState(task?.timezone ?? timezone),
    [course, setCourse] = useState(task?.course_code ?? "");
  const save = useMutation({
    mutationFn: () =>
      api.mutate<Result<Task>>(
        prefix + "/tasks" + (task ? "/" + task.id : ""),
        task ? "PATCH" : "POST",
        {
          title: title.trim(),
          description: description.trim() || null,
          priority,
          status,
          due_date: due || null,
          due_time: due && time ? time : null,
          timezone: zone,
          ...(!task || course !== (task.course_code ?? "")
            ? { course_code: course || null }
            : {}),
          ...(task ? { expected_revision: task.revision } : {}),
        },
      ),
    onSuccess: async () => {
      await refresh();
      toast(task ? "حُفظت تعديلات المهمة." : "أضيفت المهمة، وسيظهر موعدها في التقويم.");
      onClose();
    },
    onError: (e) => {
      toast(errorMessage(e), "error");
      void refresh();
    },
  });
  return (
    <Modal
      title={task ? "تعديل المهمة" : "مهمة جديدة"}
      onClose={() => {
        if (!save.isPending) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="productivity-form"
      >
        <Input
          label="عنوان المهمة"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="field">
          <label htmlFor="task-description">الوصف (اختياري)</label>
          <textarea
            id="task-description"
            maxLength={5000}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-two">
          <Select
            label="الأولوية"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            {Object.entries(priorityLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            label="حالة المهمة"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            {Object.entries(statusLabel).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="تاريخ الاستحقاق (اختياري)"
            type="date"
            min="2000-01-01"
            max="2199-12-31"
            value={due}
            onChange={(e) => {
              setDue(e.target.value);
              if (!e.target.value) setTime("");
            }}
          />
          <Input
            label="وقت الاستحقاق (اختياري)"
            type="time"
            disabled={!due}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <Input
          label="المنطقة الزمنية للموعد"
          required
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          hint="مثل Asia/Hebron أو UTC. الموعد دون وقت يستحق في نهاية ذلك اليوم."
        />
        <CourseSelect value={course} onChange={setCourse} previous={task} />
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
            حفظ المهمة
          </Button>
        </div>
      </form>
    </Modal>
  );
}
