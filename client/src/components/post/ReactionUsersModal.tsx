import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api } from "../../lib/api";
import Avatar from "../ui/Avatar";

interface Props {
  postId: string;
  open: boolean;
  onClose: () => void;
}

export default function ReactionUsersModal({
  postId,
  open,
  onClose,
}: Props) {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!open) return;

    api
      .get(`/posts/${postId}/reactions`)
      .then((res) => {
        setUsers(res.data.items || []);
      });
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg shadow-elevated border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold">
            Lượt thích
          </h2>

          <button
            className="btn-icon"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {users.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 border-b border-border"
            >
              <Avatar
                src={item.user.avatarUrl}
                name={item.user.username}
                size="sm"
              />

              <div className="flex-1">
                <p className="text-sm font-medium">
                  {item.user.username}
                </p>

                <p className="text-xs text-fg-muted">
                  {item.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}