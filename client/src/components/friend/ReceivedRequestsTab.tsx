// components/friends/ReceivedRequestsTab.tsx
import { useEffect } from "react";
import { useFriendStore } from "../../stores/friend.store";
import UserCard from "./UserCard";
import {  Spinner, EmptyState } from "../ui/Avatar";
import { timeAgo } from "../../utils";
import { UserCheck } from "lucide-react";

export default function ReceivedRequestsTab() {
  const {
    receivedRequests,
    isLoadingRequests,
    fetchReceivedRequests,
    acceptRequest,
    declineRequest,
  } = useFriendStore();

  useEffect(() => {
    fetchReceivedRequests(true);
  }, [fetchReceivedRequests]);

  if (isLoadingRequests && receivedRequests.length === 0) {
    return <Spinner className="mx-auto mt-12" />;
  }

  if (receivedRequests.length === 0) {
    return (
      <EmptyState
        icon={<UserCheck size={40} />}
        title="Không có lời mời nào"
        description="Khi ai đó gửi lời mời kết bạn, nó sẽ xuất hiện ở đây"
      />
    );
  }

  return (
    <div className="space-y-3">
      {receivedRequests.map((item: any) => (
        <UserCard
          key={item.id}
          user={item.requester}
          badge={timeAgo(item.createdAt)}
          actions={
            <>
              <button
                className="btn-primary text-sm px-5"
                onClick={() => acceptRequest(item.id)}
              >
                Chấp nhận
              </button>
              <button
                className="btn-ghost text-sm px-5 hover:text-danger"
                onClick={() => declineRequest(item.id)}
              >
                Từ chối
              </button>
            </>
          }
        />
      ))}
    </div>
  );
}