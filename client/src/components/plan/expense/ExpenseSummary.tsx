import { usePlanStore } from "../../../stores/plan.store";
import Avatar from "../../ui/Avatar";
import { cn, formatCurrency } from "../../../utils";
import { TrendingDown, Wallet, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { CATEGORY_META } from "./ExpenseFormDrawer";
import { useState } from "react";
import type { ExpenseCategory } from "../../../types";

export function ExpenseSummary({ currency }: { currency: string }) {
  const summary = usePlanStore((s) => s.expenseSummary);
  const [showDetail, setShowDetail] = useState(false);

  if (!summary) return null;

  const budgetPct = summary.totalBudget && summary.totalBudget > 0
    ? Math.min(100, Math.round((summary.totalSpent / summary.totalBudget) * 100))
    : null;

  const isOverBudget = summary.remaining != null && summary.remaining < 0;
  const isNearBudget = budgetPct != null && budgetPct >= 80 && budgetPct < 100;

  return (
    <div className="rounded-xl border border-border overflow-hidden mb-4">
      {/* Top summary row */}
      <div className="grid grid-cols-3 divide-x divide-border">
        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-fg-muted mb-1">
            <TrendingDown size={12} />
            Đã chi
          </div>
          <p className="font-semibold text-sm tabular-nums">
            {formatCurrency(summary.totalSpent, summary.currency)}
          </p>
        </div>

        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-fg-muted mb-1">
            <Wallet size={12} />
            Ngân sách
          </div>
          <p className="font-semibold text-sm tabular-nums">
            {summary.totalBudget
              ? formatCurrency(summary.totalBudget, summary.currency)
              : <span className="text-fg-subtle">—</span>}
          </p>
        </div>

        <div className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs text-fg-muted mb-1">
            <DollarSign size={12} />
            Còn lại
          </div>
          <p className={cn("font-semibold text-sm tabular-nums",
            isOverBudget ? "text-danger" : "text-success"
          )}>
            {summary.remaining != null
              ? formatCurrency(Math.abs(summary.remaining), summary.currency)
              : <span className="text-fg-subtle">—</span>}
            {isOverBudget && <span className="text-xs ml-0.5">(vượt)</span>}
          </p>
        </div>
      </div>

      {/* Budget progress bar */}
      {budgetPct !== null && (
        <div className="px-4 pb-3 pt-1 border-t border-border">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-fg-muted">Sử dụng ngân sách</span>
            <span className={cn("font-medium",
              isOverBudget ? "text-danger" : isNearBudget ? "text-warning" : "text-fg-muted"
            )}>
              {budgetPct}%
            </span>
          </div>
          <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isOverBudget ? "bg-danger" : isNearBudget ? "bg-warning" : "bg-primary"
              )}
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          {isOverBudget && (
            <p className="text-xs text-danger mt-1">
              ⚠️ Vượt ngân sách {formatCurrency(Math.abs(summary.remaining!), summary.currency)}
            </p>
          )}
        </div>
      )}

      {/* Toggle detail */}
      {(summary.byCategory.length > 0 || summary.byMember.length > 1) && (
        <button
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-fg-muted hover:bg-bg-muted transition-colors border-t border-border"
          onClick={() => setShowDetail((v) => !v)}
        >
          {showDetail ? <><ChevronUp size={14} /> Ẩn chi tiết</> : <><ChevronDown size={14} /> Xem phân tích</>}
        </button>
      )}

      {/* Detail breakdown */}
      {showDetail && (
        <div className="border-t border-border divide-y divide-border">
          {/* By category */}
          {summary.byCategory.length > 0 && (
            <div className="p-4">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">Theo danh mục</p>
              <div className="space-y-2">
                {[...summary.byCategory]
                  .sort((a, b) => b.total - a.total)
                  .map((c) => {
                    const meta = CATEGORY_META[c.category as ExpenseCategory];
                    const pct = summary.totalSpent > 0
                      ? Math.round((c.total / summary.totalSpent) * 100)
                      : 0;
                    return (
                      <div key={c.category} className="flex items-center gap-2">
                        <span className="text-base w-6 text-center flex-shrink-0">{meta?.emoji ?? "📦"}</span>
                        <span className="text-xs text-fg-muted w-20 flex-shrink-0">{meta?.label ?? c.category}</span>
                        <div className="flex-1 h-1.5 bg-bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-28 text-right tabular-nums flex-shrink-0">
                          {formatCurrency(c.total, summary.currency)}
                        </span>
                        <span className="text-xs text-fg-subtle w-8 text-right flex-shrink-0">{pct}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* By member */}
          {summary.byMember.length > 1 && (
            <div className="p-4">
              <p className="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-3">Ai trả nhiều nhất</p>
              <div className="space-y-2.5">
                {[...summary.byMember]
                  .sort((a, b) => b.total - a.total)
                  .map((m) => {
                    const pct = summary.totalSpent > 0
                      ? Math.round((m.total / summary.totalSpent) * 100)
                      : 0;
                    return (
                      <div key={m.user.id} className="flex items-center gap-2">
                        <Avatar src={m.user.avatarUrl} name={m.user.username} size="xs" />
                        <span className="text-xs text-fg flex-1 min-w-0 truncate">{m.user.username}</span>
                        <div className="w-20 h-1.5 bg-bg-muted rounded-full overflow-hidden flex-shrink-0">
                          <div className="h-full bg-accent/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-medium tabular-nums flex-shrink-0">
                          {formatCurrency(m.total, summary.currency)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}