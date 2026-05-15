import { useEffect, useState } from "react";
import { Plus, CheckSquare } from "lucide-react";

import { usePlanStore } from "../../../stores/plan.store";

import { Spinner, EmptyState } from "../../ui/Avatar";

import type { PlanMember, TaskStatus } from "../../../types";

import TaskCard from "./TaskCard";
import TaskFormModal from "./TaskFormModal";
import StatsBar from "./StatsBar";

import { STATUS_LABEL } from "../../constants/task.constants";

import { cn } from "../../../utils";

export interface TasksTabProps {
  planId: string;
  members: PlanMember[];
  canEdit: boolean;
}

export default function TasksTab({
  planId,
  members,
  canEdit,
}: TasksTabProps) {
  const tasks = usePlanStore((s) => s.tasks);

  const isLoading = usePlanStore(
    (s) => s.isLoadingTasks
  );

  const fetchTasks = usePlanStore(
    (s) => s.fetchTasks
  );

  const fetchTaskStats = usePlanStore(
    (s) => s.fetchTaskStats
  );

  const [showCreate, setShowCreate] =
    useState(false);

  const [filterStatus, setFilterStatus] =
    useState<TaskStatus | "">("");

  const [filterAssignee, setFilterAssignee] =
    useState("");

  useEffect(() => {
    fetchTasks(planId, undefined, {
      status: filterStatus || undefined,
      assigneeId: filterAssignee || undefined,
    });

    fetchTaskStats(planId);
  }, [
    planId,
    filterStatus,
    filterAssignee,
    fetchTasks,
    fetchTaskStats,
  ]);

  const filtered = tasks.filter((t) => {
    if (
      filterStatus &&
      t.status !== filterStatus
    ) {
      return false;
    }

    if (
      filterAssignee &&
      t.assignee?.id !== filterAssignee
    ) {
      return false;
    }

    return true;
  });

  return (
    <div>
      <StatsBar />

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {/* status filter */}
        <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
          {(
            ["", "TODO", "IN_PROGRESS", "DONE"] as const
          ).map((s) => (
            <button
              key={s}
              onClick={() =>
                setFilterStatus(
                  s as TaskStatus | ""
                )
              }
              className={cn(
                "shrink-0 text-xs px-3 py-1.5 rounded-full border transition-all",
                filterStatus === s
                  ? "bg-primary text-primary-fg border-primary"
                  : "border-border text-fg-muted hover:border-border-strong"
              )}
            >
              {s === ""
                ? "Tất cả"
                : STATUS_LABEL[s]}

              {s !== "" && (
                <span className="ml-1 opacity-60">
                  (
                  {
                    tasks.filter(
                      (t) => t.status === s
                    ).length
                  }
                  )
                </span>
              )}
            </button>
          ))}
        </div>

        {/* assignee filter */}
        {members.length > 0 && (
          <select
            className="input text-xs py-1.5 w-36 shrink-0"
            value={filterAssignee}
            onChange={(e) =>
              setFilterAssignee(
                e.target.value
              )
            }
          >
            <option value="">
              👤 Tất cả
            </option>

            {members.map((m) => (
              <option
                key={m.user.id}
                value={m.user.id}
              >
                {m.user.username}
              </option>
            ))}
          </select>
        )}

        {/* create button */}
        {canEdit && (
          <button
            className="btn-primary text-xs gap-1.5 shrink-0"
            onClick={() =>
              setShowCreate(true)
            }
          >
            <Plus size={14} />
            Thêm task
          </button>
        )}
      </div>

      {/* Task list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={36} />}
          title={
            filterStatus
              ? "Không có task nào"
              : "Chưa có task nào"
          }
          description={
            canEdit
              ? "Thêm task để bắt đầu theo dõi tiến độ"
              : undefined
          }
          action={
            canEdit ? (
              <button
                className="btn-primary gap-1.5"
                onClick={() =>
                  setShowCreate(true)
                }
              >
                <Plus size={15} />
                Thêm task đầu tiên
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              planId={planId}
              canEdit={canEdit}
              members={members}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <TaskFormModal
          planId={planId}
          members={members}
          onClose={() =>
            setShowCreate(false)
          }
        />
      )}
    </div>
  );
}