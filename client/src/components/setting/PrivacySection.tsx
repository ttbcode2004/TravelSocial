// components/settings/PrivacySection.tsx
import { useEffect } from "react";
import { useFriendStore } from "../../stores/friend.store";
import Avatar from "../ui/Avatar";
import { Spinner, EmptyState } from "../ui/Avatar";

export default function PrivacySection() {
  const { blockedUsers, isLoadingBlocked, fetchBlockedUsers, unblockUser } = useFriendStore();

  useEffect(() => {
    fetchBlockedUsers(true);
  }, [fetchBlockedUsers]);

  if (isLoadingBlocked && blockedUsers.length === 0) {
    return <Spinner className="mx-auto mt-12" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-1">Người dùng đã chặn</h3>
        <p className="text-sm text-fg-muted mb-6">
          Những người này không thể xem bài viết, nhắn tin hoặc tương tác với bạn.
        </p>

        {blockedUsers.length === 0 ? (
          <EmptyState title="Bạn chưa chặn ai" description="Danh sách chặn trống" />
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 rounded-2xl border border-border"
              >
                <Avatar src={item.addressee?.avatarUrl} name={item.addressee?.username} size="md" />
                <div className="flex-1">
                  <p className="font-medium">{item.addressee?.username}</p>
                </div>
                <button
                  className="btn-secondary text-sm px-5"
                  onClick={() => unblockUser(item.addressee?.id)}
                >
                  Bỏ chặn
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}