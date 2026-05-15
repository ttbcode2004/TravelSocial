// components/plan/chat/MessageBubble.tsx
import { useState } from "react";
import Avatar from "../../ui/Avatar";
import { cn, formatMessageTime } from "../../../utils";
import type { PlanMessage } from "../../../stores/plan.store";

interface BubbleProps {
  msg: PlanMessage;
  isMine: boolean;
  showAvatar: boolean;
  showTime: boolean;
}

export default function MessageBubble({ msg, isMine, showAvatar, showTime }: BubbleProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("flex items-end gap-2 group", isMine && "flex-row-reverse")}>
      {/* Avatar */}
      <div className="w-7 flex-shrink-0">
        {showAvatar && !isMine && (
          <Avatar src={msg.sender.avatarUrl} name={msg.sender.username} size="xs" />
        )}
      </div>

      <div className={cn("max-w-[68%] flex flex-col gap-0.5", isMine && "items-end")}>
        {/* Sender name */}
        {showAvatar && !isMine && (
          <span className="text-xs text-fg-subtle ml-1">{msg.sender.username}</span>
        )}

        {/* Message Bubble */}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm leading-relaxed cursor-pointer select-text",
            isMine
              ? "bg-primary text-primary-fg rounded-br-sm"
              : "bg-bg-muted text-fg rounded-bl-sm"
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          {msg.content ? (
            msg.content
          ) : (
            msg.mediaUrl && <span className="italic opacity-70">📎 Media</span>
          )}
        </div>

        {/* Timestamp */}
        {(showTime || expanded) && (
          <span className="text-xs text-fg-subtle px-1 animate-fade-in">
            {formatMessageTime(msg.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}