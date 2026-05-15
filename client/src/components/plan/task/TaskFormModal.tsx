import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../../ui/Modal";
import { Spinner } from "../../ui/Avatar";

import { usePlanStore } from "../../../stores/plan.store";

import type { Task, TaskPriority, PlanMember }from "../../../types";
import { PRIORITY_LABEL, PRIORITY_OPTIONS } from "../../constants/task.constants";

interface TaskFormProps {
  planId: string;
  members: PlanMember[];
  task?: Task;
  onClose: () => void;
}

export default function TaskFormModal({
  planId,
  members,
  task,
  onClose,
}: TaskFormProps) {
  const createTask = usePlanStore((s) => s.createTask);
  const updateTask = usePlanStore((s) => s.updateTask);

  const [form, setForm] = useState({
    title: task?.title ?? "",
    description: task?.description ?? "",
    assigneeId: task?.assignee?.id ?? "",
    dueDate: task?.dueDate?.slice(0, 10) ?? "",
    priority: (task?.priority ?? "MEDIUM") as TaskPriority,
  });

  const [saving, setSaving] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
      >
    ) => {
      setForm((f) => ({
        ...f,
        [k]: e.target.value,
      }));
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) return;

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assigneeId: form.assigneeId || undefined,
      dueDate: form.dueDate || undefined,
      priority: form.priority,
    };

    const ok = task
      ? await updateTask(planId, task.id, payload)
      : !!(await createTask(planId, payload));

    if (ok) {
      toast.success(task ? "Đã cập nhật task" : "Đã thêm task!");
      onClose();
    } else {
      toast.error("Không thể lưu task");
    }

    setSaving(false);
  };

  return (
    <Modal
      open
      title={task ? "Chỉnh sửa task" : "Tạo task mới"}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Tiêu đề *
          </label>

          <input
            className="input"
            placeholder="Đặt vé máy bay..."
            value={form.title}
            onChange={set("title")}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Mô tả
          </label>

          <textarea
            className="input min-h-18 resize-none text-sm"
            placeholder="Chi tiết thêm..."
            value={form.description}
            onChange={set("description")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Độ ưu tiên
            </label>

            <select
              className="input"
              value={form.priority}
              onChange={set("priority")}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Hạn chót
            </label>

            <input
              type="date"
              className="input"
              value={form.dueDate}
              onChange={set("dueDate")}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            Giao cho
          </label>

          <select
            className="input"
            value={form.assigneeId}
            onChange={set("assigneeId")}
          >
            <option value="">— Không giao —</option>

            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.username}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            className="btn-secondary flex-1"
            onClick={onClose}
          >
            Huỷ
          </button>

          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={saving}
          >
            {saving ? (
              <Spinner className="w-4 h-4" />
            ) : task ? (
              "Lưu thay đổi"
            ) : (
              "Tạo task"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}