import Avatar from "../ui/Avatar";

import { useUser } from "../../stores/auth.store";

import { getConversationName } from "../../utils";

import type { Conversation } from "../../types";

import MessageTyping from "./MessageTyping";

interface Props {
  conversation: Conversation;
}

export default function ChatHeader({
  conversation,
}: Props) {
  const me = useUser();

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

  return (
    <header className="h-14 border-b border-border bg-bg-elevated flex items-center gap-3 px-4">
      <Avatar
        src={
          conversation.type === "GROUP"
            ? conversation.avatarUrl
            : other?.avatarUrl
        }
        name={name}
        size="sm"
      />

      <div className="min-w-0">
        <p className="font-medium truncate">
          {name}
        </p>

        <MessageTyping conversationId={conversation.id} />
      </div>
    </header>
  );
}