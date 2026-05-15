import { useNavigate } from "react-router-dom";

import { useUser } from "../../stores/auth.store";
import { usePresenceStore } from "../../stores/presence.store";

import Avatar from "../ui/Avatar";

import { cn, formatMessageTime, getConversationName } from "../../utils";

import type { Conversation } from "../../types";

interface Props {
  conversation: Conversation;
  active?: boolean;
}

export default function ConversationItem({
  conversation,
  active,
}: Props) {
  const navigate = useNavigate();

  const me = useUser();

  const isOnline = usePresenceStore((s) => s.isOnline);

  const name = getConversationName(
    conversation,
    me?.username ?? ""
  );

  const other =
    conversation.type === "PRIVATE"
      ? conversation.members.find(
          (m) => String(m.user.id) !== String(me?.sub)
        )?.user
      : null;

  const online = other ? isOnline(other.id) : false;

  const lastMessage = conversation.lastMessage;

  return (
    <button
      onClick={() => navigate(`/chat/${conversation.id}`)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left",
        active
          ? "bg-primary-subtle"
          : "hover:bg-bg-muted"
      )}
    >
      <Avatar
        src={
          conversation.type === "GROUP"
            ? conversation.avatarUrl
            : other?.avatarUrl
        }
        name={name}
        size="md"
        online={
          conversation.type === "PRIVATE"
            ? online
            : undefined
        }
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium truncate">
            {name}
          </p>

          {lastMessage && (
            <span className="text-xs text-fg-muted">
              {formatMessageTime(lastMessage.createdAt)}
            </span>
          )}
        </div>

        {lastMessage && (
          <p className="text-xs truncate text-fg-muted mt-0.5">
            {lastMessage.isDeleted
              ? "Tin nhắn đã bị xoá"
              : lastMessage.content}
          </p>
        )}
      </div>
    </button>
  );
}