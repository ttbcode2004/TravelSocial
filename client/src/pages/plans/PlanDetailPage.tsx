import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePlanStore } from "../../stores/plan.store";
import { useUser } from "../../stores/auth.store";
import Avatar, { Spinner } from "../../components/ui/Avatar";
import TasksTab from "../../components/plan/task/TasksTab";
import ExpensesTab from "../../components/plan/expense/ExpensesTab";
import MembersTab from "../../components/plan/member/MembersTab";
import ChatTab from "../../components/plan/chat/ChatTab";
import { cn, formatDate, formatCurrency } from "../../utils";
import { CheckSquare, DollarSign, Users, MessageSquare, Ellipsis, Pencil, LogOut, Trash2, UserPlus} from "lucide-react";
import { getPlanStatusLabel } from "../../types/constants";
import MenuModal from "../../components/ui/MenuModal";
import MenuItem from "../../components/ui/MenuItem";
import UpdatePlanModal from "../../components/plan/UpdatePlanModal";

type Tab = "tasks" | "expenses" | "members" | "chat";

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();

  const [showUpdate, setShowUpdate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const me = useUser();

  const currentPlan = usePlanStore((s) => s.currentPlan);
  const isLoading   = usePlanStore((s) => s.isLoading);
  const fetchPlan   = usePlanStore((s) => s.fetchPlan);

  const deletePlan = usePlanStore((s) => s.deletePlan);
  const leavePlan = usePlanStore((s) => s.leavePlan);

  const tasks       = usePlanStore((s) => s.tasks);
  const expenses    = usePlanStore((s) => s.expenses);
  const messages    = usePlanStore((s) => s.messages);
  const taskStats   = usePlanStore((s) => s.taskStats);

  const [tab, setTab] = useState<Tab>("tasks");

  // Fetch plan
  useEffect(() => {
  if (planId) {
    fetchPlan(planId);
  }
}, [planId, fetchPlan]);

  if (isLoading || !currentPlan) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!me) return null;

  const members = currentPlan.members ?? [];

  const myMember = members.find(
  (m) => String(m.user.id) === String(me?.sub)
);
  const canEdit =
    myMember?.role === "OWNER" ||
    myMember?.role === "EDITOR" ||
    currentPlan.creator.id === me?.sub;

  const progress = taskStats?.progress ?? 0;

  const TABS = [
    {
      id: "tasks" as Tab,
      label: "Tasks",
      icon: CheckSquare,
      count: tasks.length,
    },
    {
      id: "expenses" as Tab,
      label: "Chi tiêu",
      icon: DollarSign,
      count: expenses.length,
    },
    {
      id: "members" as Tab,
      label: "Thành viên",
      icon: Users,
      count: members.length,
    },
    {
      id: "chat" as Tab,
      label: "Chat",
      icon: MessageSquare,
      count: messages.length,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="card">
        {currentPlan.coverImage && (
          <img
            src={currentPlan.coverImage}
            alt={currentPlan.title}
            className="w-full h-48 object-cover"
          />
        )}

        <div className="p-5">
          {/* Top */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold">
                {currentPlan.title}
              </h1>

              {currentPlan.description && (
                <p className="text-base text-fg-muted mt-1">
                  {currentPlan.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6">
              <span
                className={cn(
                  "badge shrink-0",
                  currentPlan.status === "ACTIVE"
                    ? "badge-primary"
                    : currentPlan.status === "COMPLETED"
                    ? "badge-success"
                    : currentPlan.status === "CANCELLED"
                    ? "badge bg-danger/10 text-danger"
                    : "badge-muted"
                )}
              >
                {getPlanStatusLabel(currentPlan.status)}
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
                      navigate(`/plans/${currentPlan.id}/members`);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus size={16} />
                      Mời thành viên
                    </div>
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      navigate(`/plans/${currentPlan.id}/members`);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      Xem thành viên
                    </div>
                  </MenuItem>

                  {!canEdit && (
                    <MenuItem
                      danger
                      onClick={async () => {
                        await leavePlan(currentPlan.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <LogOut size={16} />
                        Rời nhóm
                      </div>
                    </MenuItem>
                  )}

                  {canEdit && (
                    <MenuItem
                      danger
                      onClick={async () => {
                        await deletePlan(currentPlan.id);
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

          {/* Meta */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-base text-fg-muted mb-4">
            {currentPlan.startDate && (
              <span>
                📅 {formatDate(currentPlan.startDate)}
                {currentPlan.endDate &&
                  ` → ${formatDate(currentPlan.endDate)}`}
              </span>
            )}

            {currentPlan.totalBudget && (
              <span>
                💰 Ngân sách:{" "}
                {formatCurrency(
                  currentPlan.totalBudget,
                  currentPlan.currency
                )}
              </span>
            )}

            <span>
              👥 {members.length} thành viên
            </span>
          </div>

          {/* Members preview */}
          {members.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex -space-x-2">
                {members.slice(0, 6).map((m) => (
                  <div
                    key={m.id}
                    className="ring-2 ring-bg rounded-full"
                  >
                    <Avatar
                      src={m.user.avatarUrl}
                      name={m.user.username}
                      size="sm"
                    />
                  </div>
                ))}
              </div>

              {/* Progress */}
              {taskStats && taskStats.total > 0 && (
                <div className="w-52">
                  <div className="flex justify-between text-xs text-fg-muted mb-1">
                    <span>Tiến độ</span>
                    <span>{progress}%</span>
                  </div>

                  <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-muted p-1 rounded-sm overflow-x-auto no-scrollbar">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs md:text-base rounded-sm transition-all",
              tab === id
                ? "bg-bg-elevated text-fg font-medium shadow-card"
                : "text-fg-muted hover:text-fg"
            )}
          >
            <Icon size={16} />

            <span>{label}</span>

            {count > 0 && (
              <span className="text-sm opacity-60">
                ({count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {tab === "tasks" && (
          <TasksTab
            planId={currentPlan.id}
            members={members}
            canEdit={canEdit}
          />
        )}
        
        {tab === "expenses" && (
          <ExpensesTab
            planId={currentPlan.id}
            plan={currentPlan || []}
            canEdit={canEdit}
          />
        )}

        {tab === "members" && (
          <MembersTab plan={currentPlan} />
        )}

        {tab === "chat" && (
          <ChatTab planId={currentPlan.id} />
        )}
      </div>

      {showUpdate && (
        <UpdatePlanModal
          plan={currentPlan}
          onClose={() => setShowUpdate(false)}
        />
      )}
    </div>
  );
}