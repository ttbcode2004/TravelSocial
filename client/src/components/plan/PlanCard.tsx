import { Link, useNavigate } from "react-router-dom";
import Avatar from "../ui/Avatar";
import { cn, formatDate, formatCurrency } from "../../utils";
import { Calendar, Users, Wallet, Ellipsis, LogOut, Pencil, UserPlus, Trash2 } from "lucide-react";
import type { Plan, PlanStatus } from "../../types";
import { useState } from "react";
import { usePlanStore } from "../../stores/plan.store";
import UpdatePlanModal from "./UpdatePlanModal";
import { useUser } from "../../stores/auth.store";
import MenuModal from "../ui/MenuModal";
import MenuItem from "../ui/MenuItem";

const STATUS_STYLE: Record<PlanStatus, string> = {
  DRAFT: "badge-muted",
  ACTIVE: "badge-primary",
  COMPLETED: "badge-success",
  CANCELLED: "badge bg-danger/10 text-danger",
};

const STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "Nháp",
  ACTIVE: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

interface Props {
  plan: Plan;
}

export default function PlanCard({ plan }: Props) {
  const fetchPlans = usePlanStore((s) => s.fetchPlans);
  const [showUpdate, setShowUpdate] = useState(false);

  const navigate = useNavigate();

const user = useUser();

const deletePlan = usePlanStore((s) => s.deletePlan);
const leavePlan = usePlanStore((s) => s.leavePlan);

const [showMenu, setShowMenu] = useState(false);

const myMember = plan.members?.find(
  (m) => m.user.id === user?.id
);

const isOwner = myMember?.role === "OWNER";

  const progress =
    plan._count.tasks > 0
      ? Math.round(
          (((plan as any).doneTasksCount ?? 0) / plan._count.tasks) * 100,
        )
      : 0;

  return (
    <>
      <Link
        to={`/plans/${plan.id}`}
        className="card p-5 block hover:shadow-elevated transition-shadow group"
      >
        {/* Cover */}
        {plan.coverImage && (
          <div className="h-32 rounded-lg overflow-hidden mb-4 -mx-1">
            <img
              src={plan.coverImage}
              alt={plan.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
            {plan.title}
          </h3>
          <div className="flex items-center gap-6">
            <span className={cn("badge shrink-0", STATUS_STYLE[plan.status])}>
              {STATUS_LABEL[plan.status]}
            </span>
            <div 
              className="relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu((v) => !v);
                }}
              >
                <Ellipsis size={20} />
              </button>

              <MenuModal
                open={showMenu}
                onClose={() => setShowMenu(false)}
              >
                <MenuItem
                  onClick={() => {
                    setShowMenu(false);
                    setShowUpdate(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Pencil size={16} />
                    Chỉnh sửa
                  </div>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    navigate(`/plans/${plan.id}/members`);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <UserPlus size={16} />
                    Mời thành viên
                  </div>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    navigate(`/plans/${plan.id}/members`);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    Xem thành viên
                  </div>
                </MenuItem>

                {!isOwner && (
                  <MenuItem
                    danger
                    onClick={async () => {
                      await leavePlan(plan.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <LogOut size={16} />
                      Rời nhóm
                    </div>
                  </MenuItem>
                )}

                {isOwner && (
                  <MenuItem
                    danger
                    onClick={async () => {
                      await deletePlan(plan.id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 size={16} />
                      Xoá kế hoạch
                    </div>
                  </MenuItem>
                )}
              </MenuModal>
            </div>
          </div>
        </div>

        {plan.description && (
          <p className="text-sm text-fg-muted line-clamp-2 mb-3">
            {plan.description}
          </p>
        )}

        <div className="flex flex-wrap lg:flex-col gap-x-4 sm:gap-x-6 gap-y-1.5 text-sm sm:text-base text-fg-muted mb-3">
          {plan.startDate && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(plan.startDate)}
              {plan.endDate && ` → ${formatDate(plan.endDate)}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={12} />
            {plan._count.members} thành viên
          </span>
          {plan.totalBudget && (
            <span className="flex items-center gap-1">
              <Wallet size={12} />
              {formatCurrency(plan.totalBudget, plan.currency)}
            </span>
          )}
        </div>

        {/* Task progress */}
        {plan._count.tasks > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-fg-muted mb-1">
              <span>Tiến độ tasks</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Members preview */}
        <div className="flex items-center">
          <div className="flex space-x-2">
            {plan.members?.slice(0, 4).map((m) => (
              <Avatar
                key={m.id}
                src={m.user.avatarUrl}
                name={m.user.username}
                size="xs"
                className="ring-2 ring-bg-elevated"
              />
            ))}
            {plan._count.members > 4 && (
              <div className="w-6 h-6 rounded-full bg-bg-muted border-2 border-bg-elevated flex items-center justify-center text-xs text-fg-muted">
                +{plan._count.members - 4}
              </div>
            )}
          </div>
          <span className="text-base text-fg-subtle ">
            {plan._count.expenses} chi tiêu
          </span>
        </div>   
      </Link>
      {showUpdate && (
          <UpdatePlanModal
            plan={plan}
            onClose={() => setShowUpdate(false)}
          />
        )}
    </>
  );
}
