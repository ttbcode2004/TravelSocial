// components/plan/chat/ChatTab.tsx
import { useEffect, useRef, useState } from "react";
import { usePlanStore } from "../../../stores/plan.store";
import { useUser } from "../../../stores/auth.store";
import { MessageSquare, ChevronUp } from "lucide-react";
import Avatar, { Spinner, EmptyState } from "../../ui/Avatar";
import { cn } from "../../../utils";

import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

interface ChatTabProps {
  planId: string;
}

export default function ChatTab({ planId }: ChatTabProps) {
  const me = useUser();
  const messages = usePlanStore((s) => s.messages);
  const nextMsgCursor = usePlanStore((s) => s.nextMsgCursor);
  const isLoading = usePlanStore((s) => s.isLoadingMessages);
  const fetchMessages = usePlanStore((s) => s.fetchMessages);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Initial fetch
  useEffect(() => {
    fetchMessages(planId);
  }, [planId, fetchMessages]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const loadMore = async () => {
    if (!nextMsgCursor || loadingMore) return;

    const container = containerRef.current;
    const prevHeight = container?.scrollHeight ?? 0;

    setLoadingMore(true);
    await fetchMessages(planId, nextMsgCursor);
    setLoadingMore(false);

    // Restore scroll position
    if (container) {
      container.scrollTop = container.scrollHeight - prevHeight;
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-col h-[520px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-border overflow-hidden bg-bg-elevated" style={{ height: "520px" }}>
      {/* Messages Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar"
      >
        {/* Load more button */}
        {nextMsgCursor && (
          <div className="flex justify-center pb-2">
            <button
              className="btn-ghost text-xs gap-1.5"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <Spinner className="w-3.5 h-3.5" />
              ) : (
                <>
                  <ChevronUp size={14} /> Xem tin nhắn cũ hơn
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {messages.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={<MessageSquare size={36} />}
              title="Chưa có tin nhắn nào"
              description="Bắt đầu thảo luận về kế hoạch với cả nhóm!"
            />
          </div>
        )}

        {/* Messages List */}
        {messages.map((msg, i) => {
          const isMine = String(msg.sender.id) === String(me?.sub);
          const prev = messages[i - 1];
          const next = messages[i + 1];

          const showAvatar = !prev || String(prev.sender.id) !== String(msg.sender.id);
          const isLastFromSender = !next || String(next.sender.id) !== String(msg.sender.id);

          const prevTime = prev ? new Date(prev.createdAt).getTime() : 0;
          const thisTime = new Date(msg.createdAt).getTime();
          const showTime = isLastFromSender || thisTime - prevTime > 10 * 60 * 1000;

          const prevDate = prev ? new Date(prev.createdAt).toDateString() : null;
          const thisDate = new Date(msg.createdAt).toDateString();
          const showDate = prevDate !== thisDate;

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-fg-subtle px-2 flex-shrink-0">
                    {new Date(msg.createdAt).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              <MessageBubble
                msg={msg}
                isMine={isMine}
                showAvatar={showAvatar}
                showTime={showTime}
              />
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <MessageInput planId={planId} />
    </div>
  );
}