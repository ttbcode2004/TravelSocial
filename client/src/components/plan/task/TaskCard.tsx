import { useState } from "react";
import toast from "react-hot-toast";
import {
  Check,
  Clock,
  Trash2,
  Edit3,
  AlertCircle,
} from "lucide-react";

import Avatar, { Spinner } from "../../ui/Avatar";
import { ConfirmModal } from "../../ui/Modal";

import { usePlanStore } from "../../../stores/plan.store";

import {
  STATUS_CYCLE,
  STATUS_LABEL,
  PRIORITY_LABEL,
  PRIORITY_BADGE,
} from "../../constants/task.constants";

import { cn, formatDate, STATUS_COLOR } from "../../../utils";

import type { Task, PlanMember } from "../../../types";

import TaskFormModal from "./TaskFormModal";

export default function TaskCard({
  task, planId, canEdit, members,
}: {
  task: Task; planId: string; canEdit: boolean; members: PlanMember[];
}) {
  const updateTask  = usePlanStore((s) => s.updateTask);
  const deleteTask  = usePlanStore((s) => s.deleteTask);
  const [editing, setEditing]  = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cycling, setCycling]  = useState(false);

  const cycleStatus = async () => {
    setCycling(true);
    await updateTask(planId, task.id, { status: STATUS_CYCLE[task.status] });
    setCycling(false);
  };

  const handleDelete = async () => {
    const ok = await deleteTask(planId, task.id);
    if (ok) toast.success("Đã xoá task");
    else toast.error("Không thể xoá");
    setDeleting(false);
  };

  const isDone = task.status === "DONE" || task.status === "CANCELLED";
  const isOverdue = task.dueDate && !isDone && new Date(task.dueDate) < new Date();

  return (
    <>
      <div className={cn(
        "flex items-start gap-3 p-3.5 rounded-xl border transition-all group",
        isDone ? "border-border opacity-60 bg-bg-subtle" : "border-border hover:border-primary/30 hover:shadow-card bg-bg-elevated"
      )}>
        {/* Status checkbox */}
        <button
          onClick={cycleStatus}
          disabled={cycling}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-md shrink-0 border-2 flex items-center justify-center transition-all",
            isDone
              ? "bg-success border-success text-white"
              : task.status === "IN_PROGRESS"
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary"
          )}
        >
          {cycling ? <Spinner className="w-3 h-3" /> : isDone && <Check size={12} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium", isDone && "line-through text-fg-muted")}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-fg-muted mt-0.5 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className={cn("rounded-lg text-base", PRIORITY_BADGE[task.priority])}>
              {PRIORITY_LABEL[task.priority]}
            </span>
            <select
                value={task.status}
                onChange={(e) =>
                    updateTask(planId, task.id, {
                    status: e.target.value as Task["status"],
                    })
                }
                className={cn(
                    "rounded-lg text-base p-1 border-none bg-bg cursor-pointer outline-none",
                    STATUS_COLOR[task.status]
                )}
                >
                <option value="TODO">
                    Chưa làm
                </option>

                <option value="IN_PROGRESS">
                    Đang làm
                </option>

                <option value="DONE">
                    Đã làm xong
                </option>

                <option value="CANCELLED">
                    Huỷ
                </option>
                </select>

            {task.dueDate && (
              <span className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-danger font-medium" : "text-fg-muted"
              )}>
                <Clock size={11} />
                {isOverdue && <AlertCircle size={11} />}
                {formatDate(task.dueDate)}
              </span>
            )}

            {task.assignee && (
              <div className="flex items-center gap-1">
                <Avatar src={task.assignee.avatarUrl} name={task.assignee.username} size="xs" />
                <span className="text-xs text-fg-muted">{task.assignee.username}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-1 transition-opacity">
            <button className="btn-icon p-1.5" onClick={() => setEditing(true)}>
              <Edit3 size={14} />
            </button>
            <button className="btn-icon p-1.5 hover:text-danger hover:bg-danger/10" onClick={() => setDeleting(true)}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {editing && (
        <TaskFormModal planId={planId} members={members} task={task} onClose={() => setEditing(false)} />
      )}

      <ConfirmModal
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={handleDelete}
        title="Xoá task?"
        description={`Task "${task.title}" sẽ bị xoá vĩnh viễn.`}
        confirmLabel="Xoá task"
      />
    </>
  );
}