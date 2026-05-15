// components/plan/MembersTab.tsx
import { useState } from "react";
import { useUser } from "../../../stores/auth.store";
import { usePlanStore } from "../../../stores/plan.store";
import Avatar, { EmptyState } from "../../ui/Avatar";
import { Crown, Edit3, Shield, UserPlus, UserX, Users } from "lucide-react";
import toast from "react-hot-toast";
import type { Plan, PlanMemberRole } from "../../../types";
import MemberCard from "./MemberCard";
import InviteModal from "./InviteModal";
import { ConfirmModal } from "../../ui/Modal";
import { cn } from "../../../utils";

interface MembersTabProps {
  plan: Plan;
}

export const ROLE_META: Record<PlanMemberRole, { label: string; color: string; icon: React.ReactNode }> = {
  OWNER:  { label: "Owner",   color: "badge-primary",   icon: <Crown size={11} /> },
  EDITOR: { label: "Editor",  color: "badge-success",   icon: <Edit3 size={11} /> },
  VIEWER: { label: "Viewer",  color: "badge-muted",     icon: <Shield size={11} /> },
};

export default function MembersTab({ plan }: MembersTabProps) {
  const me = useUser();
  const leavePlan = usePlanStore((s) => s.leavePlan);

  const [showInvite, setShowInvite] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  const members = plan.members ?? [];
  const myMember = members.find((m) => String(m.user.id) === String(me?.sub));
  const isOwner = myMember?.role === "OWNER" || String(plan.creator.id) === String(me?.sub);

  const handleLeave = async () => {
    const ok = await leavePlan(plan.id);
    if (ok) toast.success("Đã rời kế hoạch");
    else toast.error("Không thể rời kế hoạch");
    setShowLeave(false);
  };

  // Sort: Owner → Editor → Viewer
  const roleOrder: Record<string, number> = { OWNER: 0, EDITOR: 1, VIEWER: 2 };
  const sorted = [...members].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-fg-muted">{members.length} thành viên</p>
        <div className="flex gap-2">
          {isOwner && (
            <button className="btn-primary text-xs gap-1.5" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Mời thành viên
            </button>
          )}
          {!isOwner && myMember && (
            <button
              className="btn-ghost text-xs text-danger hover:bg-danger/10"
              onClick={() => setShowLeave(true)}
            >
              <UserX size={14} /> Rời kế hoạch
            </button>
          )}
        </div>
      </div>

      {/* Role Legend */}
      <div className="card p-3 mb-4 flex gap-4 flex-wrap">
        {Object.entries(ROLE_META).map(([role, meta]) => (
          <div key={role} className="flex items-center gap-1.5 text-xs text-fg-muted">
            <span className={cn("badge text-xs gap-1", meta.color)}>{meta.icon} {meta.label}</span>
            <span>—</span>
            <span>
              {role === "OWNER"
                ? "Toàn quyền quản lý"
                : role === "EDITOR"
                ? "Thêm, sửa task & chi tiêu"
                : "Chỉ xem"}
            </span>
          </div>
        ))}
      </div>

      {/* Members List */}
      {sorted.length === 0 ? (
        <EmptyState icon={<Users size={36} />} title="Chưa có thành viên" />
      ) : (
        <div className="space-y-2">
          {sorted.map((m) => (
            <MemberCard
              key={m.id}
              member={m}
              planId={plan.id}
              isOwner={isOwner}
              isMyself={String(m.user.id) === String(me?.sub)}
            />
          ))}
        </div>
      )}

      {showInvite && <InviteModal planId={plan.id} onClose={() => setShowInvite(false)} />}

      <ConfirmModal
        open={showLeave}
        onClose={() => setShowLeave(false)}
        onConfirm={handleLeave}
        title="Rời kế hoạch?"
        description="Bạn sẽ mất quyền truy cập kế hoạch này."
        confirmLabel="Rời kế hoạch"
      />
    </div>
  );
}