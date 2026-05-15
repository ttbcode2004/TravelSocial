import { Plus, MessageCircle } from "lucide-react";

import { useConversationStore } from "../../stores/conversation.store";

import ConversationItem from "./ConversationItem";

import { EmptyState } from "../ui/Avatar";

export default function ChatSidebar() {
  const conversations = useConversationStore((s) => s.conversations);
  const activeConversationId = useConversationStore(
    (s) => s.activeConversationId
  );

  return (
    <aside className="w-80 border-r border-border bg-bg-subtle flex flex-col">
      <div className="h-14 border-b border-border flex items-center justify-between px-4">
        <h2 className="font-semibold">Tin nhắn</h2>

        <button className="btn-icon">
          <Plus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={32} />}
            title="Chưa có cuộc trò chuyện"
          />
        ) : (
          conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              active={conv.id === activeConversationId}
            />
          ))
        )}
      </div>
    </aside>
  );
}