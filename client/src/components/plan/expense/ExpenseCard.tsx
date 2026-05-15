import { useState } from "react";
import Avatar from "../../../components/ui/Avatar";
import { cn, formatCurrency, formatDate } from "../../../utils";
import { Edit3, Trash2, Receipt, ExternalLink } from "lucide-react";
import { CATEGORY_META } from "./ExpenseFormDrawer";
import { ExpenseFormDrawer } from "./ExpenseFormDrawer";
import { DeleteExpenseConfirm } from "./DeleteExpenseConfirm";
import type { Expense } from "../../../types";

interface ExpenseCardProps {
  expense: Expense;
  planId: string;
  currency: string;
  canEdit: boolean;
}

export function ExpenseCard({ expense, planId, currency, canEdit }: ExpenseCardProps) {
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const meta = CATEGORY_META[expense.category];

  return (
    <>
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:bg-bg-muted transition-colors group">
        {/* Category icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
          meta.color
        )}>
          {meta.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium line-clamp-1">{expense.title}</p>
            {expense.receiptUrl && (
              <a
                href={expense.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-fg-subtle hover:text-primary transition-colors"
                title="Xem hoá đơn"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={cn("badge text-xs", meta.color)}>{meta.label}</span>
            <div className="flex items-center gap-1">
              <Avatar src={expense.paidBy.avatarUrl} name={expense.paidBy.username} size="xs" />
              <span className="text-xs text-fg-muted">{expense.paidBy.username}</span>
            </div>
            {expense.expenseDate && (
              <span className="text-xs text-fg-subtle">{formatDate(expense.expenseDate)}</span>
            )}
          </div>

          {expense.notes && (
            <p className="text-xs text-fg-subtle mt-0.5 line-clamp-1 italic">{expense.notes}</p>
          )}
        </div>

        {/* Amount + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="font-semibold text-sm tabular-nums">
            {formatCurrency(expense.amount, expense.currency)}
          </p>

          {canEdit && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="btn-icon p-1.5"
                onClick={() => setShowEdit(true)}
                title="Chỉnh sửa"
              >
                <Edit3 size={14} />
              </button>
              <button
                className="btn-icon p-1.5 hover:text-danger hover:bg-danger/10"
                onClick={() => setShowDelete(true)}
                title="Xoá"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit drawer */}
      <ExpenseFormDrawer
        open={showEdit}
        onClose={() => setShowEdit(false)}
        planId={planId}
        currency={currency}
        expense={expense}
      />

      {/* Delete confirm */}
      <DeleteExpenseConfirm
        open={showDelete}
        onClose={() => setShowDelete(false)}
        expense={expense}
        planId={planId}
      />
    </>
  );
}