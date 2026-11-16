import { Link } from "react-router-dom";
import { Trash2, Pencil, CheckCircle2, Clock3, BookOpen } from "lucide-react";
import type { Task, TaskStatus } from "./api";
import { Badge } from "../../shared/ui";
import { dayLabel } from "./time";
import { priorityLabel, statusLabel } from "./labels";

export function TaskRow({
  task,
  onEdit,
  onDelete,
  onStatus,
}: {
  task: Task;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatus?: (status: TaskStatus) => void;
}) {
  return (
    <article
      className={`task-row ${task.status === "COMPLETED" ? "task-completed" : ""}`}
    >
      <button
        className={`task-check ${task.status === "COMPLETED" ? "checked" : ""}`}
        aria-label={`${task.status === "COMPLETED" ? "إعادة فتح" : "إكمال"} المهمة ${task.title}`}
        onClick={() => onStatus?.(task.status === "COMPLETED" ? "TODO" : "COMPLETED")}
        disabled={!onStatus}
      >
        <CheckCircle2 size={30} />
      </button>
      <div className="task-main">
        <Link to={`/app/tasks/${task.id}`} className="task-title">
          {task.title}
        </Link>
        <div className="task-chips">
          <Badge tone={task.priority === "HIGH" ? "amber" : "neutral"}>
            أولوية {priorityLabel[task.priority]}
          </Badge>
          <Badge
            tone={
              task.status === "COMPLETED"
                ? "teal"
                : task.status === "IN_PROGRESS"
                  ? "blue"
                  : "neutral"
            }
          >
            {statusLabel[task.status]}
          </Badge>
          {task.is_overdue && <Badge tone="amber">متأخرة</Badge>}
          {task.course_code && (
            <span>
              <BookOpen size={13} />
              <bdi>{task.course_code}</bdi>
            </span>
          )}
        </div>
        <p className="task-deadline">
          <Clock3 size={14} />
          {task.due_date
            ? `${dayLabel(task.due_date)}${task.due_time ? " · " + task.due_time : " · نهاية اليوم"} · ${task.timezone}`
            : "دون موعد محدد"}
        </p>
      </div>
      <div className="task-actions">
        {onEdit && (
          <button
            className="icon-btn"
            aria-label={`تعديل المهمة ${task.title}`}
            onClick={onEdit}
          >
            <Pencil size={17} />
          </button>
        )}
        {onDelete && (
          <button
            className="icon-btn remove-btn"
            aria-label={`حذف المهمة ${task.title}`}
            onClick={onDelete}
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>
    </article>
  );
}
