// components/chat/MessageBubble.tsx
import { useState } from "react";
import Avatar from "../ui/Avatar";
import { cn, formatMessageTime } from "../../utils";
import { Trash2 } from "lucide-react";

interface MessageBubbleProps {
  msg: any; // Bạn có thể import type Message sau
  isMine: boolean;
  showAvatar: boolean;
}

export default function MessageBubble({ msg, isMine, showAvatar }: MessageBubbleProps) {
  const [showTime, setShowTime] = useState(false);

  return (
    <div className={cn("flex items-end gap-2 group", isMine && "flex-row-reverse")}>
      {/* Avatar */}
      <div className="w-7 flex-shrink-0">
        {showAvatar && !isMine && (
          <Avatar 
            src={msg.sender.avatarUrl} 
            name={msg.sender.username} 
            size="xs" 
          />
        )}
      </div>

      <div className={cn("max-w-[65%] flex flex-col gap-1", isMine && "items-end")}>
        {/* Tên người gửi */}
        {showAvatar && !isMine && (
          <span className="text-xs text-fg-subtle ml-1">{msg.sender.username}</span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm cursor-pointer select-text break-words",
            isMine
              ? "bg-primary text-primary-fg rounded-br-sm"
              : "bg-bg-muted text-fg rounded-bl-sm",
            msg.isDeleted && "italic opacity-60"
          )}
          onClick={() => setShowTime((t) => !t)}
        >
          {msg.isDeleted 
            ? "Tin nhắn đã bị xoá" 
            : (msg.content ?? "📎 Media")
          }
        </div>

        {/* Timestamp */}
        {showTime && (
          <span className="text-xs text-fg-subtle px-1">
            {formatMessageTime(msg.createdAt)}
          </span>
        )}
      </div>

      {/* Nút xóa (chỉ tin nhắn của mình) */}
      {isMine && !msg.isDeleted && (
        <button className="opacity-0 group-hover:opacity-100 transition-opacity btn-icon p-1 text-fg-subtle hover:text-danger">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}