// components/plan/InviteModal.tsx
import { useState } from "react";
import { usePlanStore } from "../../../stores/plan.store";
import Modal from "../../ui/Modal";
import { cn } from "../../../utils";
import { Crown, Edit3, Shield, UserPlus} from "lucide-react";
import toast from "react-hot-toast";
import type { PlanMemberRole } from "../../../types";
import { Spinner } from "../../ui/Avatar";

const ROLE_META: Record<PlanMemberRole, { label: string; color: string; icon: React.ReactNode }> = {
  OWNER:  { label: "Owner",   color: "badge-primary",   icon: <Crown size={11} /> },
  EDITOR: { label: "Editor",  color: "badge-success",   icon: <Edit3 size={11} /> },
  VIEWER: { label: "Viewer",  color: "badge-muted",     icon: <Shield size={11} /> },
};

export default function InviteModal({ planId, onClose }: { planId: string; onClose: () => void }) {
  const inviteMembers = usePlanStore((s) => s.inviteMembers);
  const [usernames, setUsernames] = useState("");
  const [role, setRole] = useState<PlanMemberRole>("VIEWER");
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<{ username: string; found: boolean }[]>([]);

//   const submit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const names = usernames.split(",").map((u) => u.trim()).filter(Boolean);
//     if (!names.length) return;

//     setSaving(true);
//     try {
//       const searches = await Promise.all(
//         names.map((username) =>
//           api.get("/users/search", { params: { q: username, limit: 1 } })
//             .then((r: any) => ({ username, user: r.data.items?.[0] ?? null }))
//             .catch(() => ({ username, user: null }))
//         )
//       );

//       const found = searches.filter((s: any) => s.user);
//       const notFound = searches.filter((s: any) => !s.user);

//       setResults(searches.map((s: any) => ({ username: s.username, found: !!s.user })));

//       if (found.length === 0) {
//         toast.error("Không tìm thấy người dùng nào");
//         return;
//       }

//       const userIds = found.map((s: any) => s.user.id);
//       const ok = await inviteMembers(planId, userIds, role);

//       if (ok) {
//         toast.success(`Đã mời ${found.length} thành viên!`);
//         if (notFound.length > 0) {
//           toast(`Không tìm thấy: ${notFound.map((s: any) => s.username).join(", ")}`, { icon: "⚠️" });
//         }
//         onClose();
//       } else {
//         toast.error("Không thể mời thành viên");
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

    const submit = ()=> {}

  return (
    <Modal open title="Mời thành viên" description="Nhập username, cách nhau bởi dấu phẩy" onClose={onClose} size="md">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Username *</label>
          <textarea
            className="input min-h-[72px] resize-none text-sm"
            placeholder="alice, bob, charlie"
            value={usernames}
            onChange={(e) => setUsernames(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Quyền hạn</label>
          <div className="grid grid-cols-2 gap-2">
            {(["VIEWER", "EDITOR"] as PlanMemberRole[]).map((r) => {
              const meta = ROLE_META[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-xl border-2 text-sm transition-all text-left",
                    role === r ? "border-primary bg-primary-subtle" : "border-border hover:border-border-strong"
                  )}
                >
                  <span className={cn("badge text-xs gap-1", meta.color)}>
                    {meta.icon} {meta.label}
                  </span>
                  <span className="text-xs text-fg-muted">
                    {r === "VIEWER" ? "Xem kế hoạch" : "Chỉnh sửa, thêm task/chi tiêu"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {results.length > 0 && (
          <div className="space-y-1">
            {results.map(({ username, found }) => (
              <div key={username} className={cn("flex items-center gap-2 text-xs px-2 py-1 rounded-lg", found ? "text-success" : "text-danger")}>
                <span>{found ? "✓" : "✗"}</span>
                <span>{username} — {found ? "Tìm thấy" : "Không tìm thấy"}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Huỷ</button>
          <button type="submit" className="btn-primary flex-1" disabled={saving}>
            {saving ? <Spinner className="w-4 h-4" /> : <><UserPlus size={15} /> Gửi lời mời</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}