// components/plan/MemberCard.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePlanStore } from "../../../stores/plan.store";
import Avatar from "../../ui/Avatar";
import { ConfirmModal } from "../../ui/Modal";
import { cn, formatDate } from "../../../utils";
import { UserX, Crown, Edit3, Shield } from "lucide-react";
import toast from "react-hot-toast";
import type { PlanMember, PlanMemberRole } from "../../../types";
import { ROLE_META } from "./MembersTab";



interface MemberCardProps {
  member: PlanMember;
  planId: string;
  isOwner: boolean;
  isMyself: boolean;
}

export default function MemberCard({ member, planId, isOwner, isMyself }: MemberCardProps) {
  const updateMemberRole = usePlanStore((s) => s.updateMemberRole);
  const removeMember = usePlanStore((s) => s.removeMember);

  const [removing, setRemoving] = useState(false);
  const [changingRole, setChangingRole] = useState(false);

  const meta = ROLE_META[member.role];

  const handleRoleChange = async (newRole: PlanMemberRole) => {
    if (newRole === member.role) return;
    setChangingRole(true);
    const ok = await updateMemberRole(planId, member.user.id, newRole);
    if (ok) toast.success(`Đã đổi quyền thành ${ROLE_META[newRole].label}`);
    else toast.error("Không thể đổi quyền");
    setChangingRole(false);
  };

  const handleRemove = async () => {
    const ok = await removeMember(planId, member.user.id);
    if (ok) toast.success(`Đã xoá ${member.user.username}`);
    else toast.error("Không thể xoá thành viên");
    setRemoving(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-bg-muted transition-colors group">
        <Link to={`/profile/${member.user.username}`} className="flex-shrink-0">
          <Avatar src={member.user.avatarUrl} name={member.user.username} size="md" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${member.user.username}`} className="font-medium text-sm hover:text-primary transition-colors">
              {member.user.username}
            </Link>
            {isMyself && <span className="text-xs text-fg-subtle">(Bạn)</span>}
          </div>
          <p className="text-xs text-fg-subtle mt-0.5">Tham gia {formatDate(member.joinedAt)}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isOwner && !isMyself && member.role !== "OWNER" ? (
            <select
              className="input text-xs py-1 w-28"
              value={member.role}
              onChange={(e) => handleRoleChange(e.target.value as PlanMemberRole)}
              disabled={changingRole}
            >
              <option value="VIEWER">Viewer</option>
              <option value="EDITOR">Editor</option>
            </select>
          ) : (
            <span className={cn("badge text-xs gap-1", meta.color)}>
              {meta.icon} {meta.label}
            </span>
          )}

          {isOwner && !isMyself && member.role !== "OWNER" && (
            <button
              className="btn-icon p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-danger hover:bg-danger/10"
              onClick={() => setRemoving(true)}
              title="Xoá khỏi kế hoạch"
            >
              <UserX size={15} />
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={removing}
        onClose={() => setRemoving(false)}
        onConfirm={handleRemove}
        title="Xoá thành viên?"
        description={`${member.user.username} sẽ bị xoá khỏi kế hoạch và mất quyền truy cập.`}
        confirmLabel="Xoá thành viên"
      />
    </>
  );
}