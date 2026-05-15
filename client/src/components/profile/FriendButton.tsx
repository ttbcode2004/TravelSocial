// components/profile/FriendButton.tsx
import { useFriendStore } from "../../stores/friend.store";
import { UserPlus, UserCheck, UserMinus } from "lucide-react";
import type { FriendshipStatusView } from "../../types";

interface Props {
  userId: string;
  status: FriendshipStatusView;
  friendshipId: string | null;
}

export default function FriendButton({ userId, status, friendshipId }: Props) {
  const { sendRequest, acceptRequest, unfriend, cancelRequest } = useFriendStore();

  const handleAction = () => {
    switch (status) {
      case "ACCEPTED":
        unfriend(userId);
        break;
      case "PENDING_SENT":
        if (friendshipId) cancelRequest(friendshipId);
        break;
      case "PENDING_RECEIVED":
        if (friendshipId) acceptRequest(friendshipId);
        break;
      case "NONE":
      default:
        sendRequest(userId);
        break;
    }
  };

  if (status === "ACCEPTED") {
    return (
      <button className="btn-secondary gap-2" onClick={handleAction}>
        <UserCheck size={16} /> Bạn bè
      </button>
    );
  }

  if (status === "PENDING_SENT") {
    return (
      <button className="btn-secondary gap-2" onClick={handleAction}>
        <UserMinus size={16} /> Huỷ lời mời
      </button>
    );
  }

  if (status === "PENDING_RECEIVED") {
    return (
      <button className="btn-primary gap-2" onClick={handleAction}>
        <UserCheck size={16} /> Chấp nhận
      </button>
    );
  }

  return (
    <button className="btn-primary gap-2" onClick={handleAction}>
      <UserPlus size={16} /> Kết bạn
    </button>
  );
}