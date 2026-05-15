// components/chat/MessageInput.tsx
import { useState, useRef, useEffect } from "react";
import { useConversationStore } from "../../stores/conversation.store";
import { Send} from "lucide-react";
import { Spinner } from "../ui/Avatar";

interface MessageInputProps {
  conversationId: string;
}

export default function MessageInput({ conversationId }: MessageInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = useConversationStore((s) => s.sendMessage);
  const startTyping = useConversationStore((s) => s.startTyping);
  const stopTyping = useConversationStore((s) => s.stopTyping);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);

    startTyping(conversationId);

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(() => {
      stopTyping(conversationId);
    }, 2000);
  };

  const submit = async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setText("");
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }
    stopTyping(conversationId);

    try {
      await sendMessage(conversationId, content);
    } catch (err) {
      console.error("Send message failed:", err);
      setText(content); // rollback
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    };
  }, []);

  return (
    <div className="border-t border-border p-3 flex items-end gap-2 bg-bg-elevated">
      <textarea
        className="input flex-1 min-h-[40px] max-h-[120px] resize-none py-2.5 text-sm"
        placeholder="Nhập tin nhắn..."
        value={text}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        rows={1}
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = Math.min(el.scrollHeight, 120) + "px";
        }}
      />

      <button
        className="btn-primary p-2.5 rounded-xl flex-shrink-0 disabled:opacity-50"
        onClick={submit}
        disabled={!text.trim() || sending}
      >
        {sending ? <Spinner className="w-4 h-4" /> : <Send size={18} />}
      </button>
    </div>
  );
}