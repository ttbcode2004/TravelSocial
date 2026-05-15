import { usePlanStore } from "../../../stores/plan.store";
import type { TaskStatus } from "../../../types";

import { STATUS_LABEL } from "../../constants/task.constants";

export default function StatsBar() {
  const stats = usePlanStore((s) => s.taskStats);

  if (!stats || stats.total === 0) return null;

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-fg-muted">
          Tiến độ tổng thể
        </span>

        <span className="text-sm font-semibold text-primary">
          {stats.progress}%
        </span>
      </div>

      <div className="h-2 bg-bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700"
          style={{ width: `${stats.progress}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {(
          ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as TaskStatus[]
        ).map((s) => (
          <div key={s}>
            <p className="text-base font-semibold">
              {stats.byStatus[s] ?? 0}
            </p>

            <p className="text-xs text-fg-subtle mt-0.5">
              {STATUS_LABEL[s]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}