import { useEffect } from "react";

import {
  useConversationStore,
  useActiveMessages,
} from "../../stores/conversation.store";

import { useUser } from "../../stores/auth.store";

import MessageBubble from "./MessageBubble";

import { Spinner } from "../ui/Avatar";

import useChatScroll from "./hooks/useChatScroll";

interface Props {
  conversationId: string;
}

export default function MessageList({
  conversationId,
}: Props) {
  const me = useUser();

  const messages = useActiveMessages();

  const isLoading = useConversationStore(
    (s) => s.isLoadingMessages
  );

  const bottomRef = useChatScroll(messages);

  // mark read
  const markAsRead = useConversationStore(
    (s) => s.markAsRead
  );

  useEffect(() => {
    markAsRead(conversationId);
  }, [messages.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {isLoading && messages.length === 0 && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {messages.map((msg, index) => {
        const prev = messages[index - 1];

        const showAvatar =
          !prev ||
          String(prev.sender.id) !==
            String(msg.sender.id);

        return (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isMine={
              String(msg.sender.id) ===
              String(me?.sub)
            }
            showAvatar={showAvatar}
          />
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}