// components/plan/chat/MessageInput.tsx
import { useState, useRef } from "react";
import { usePlanStore } from "../../../stores/plan.store";
import { Send } from "lucide-react";
import { Spinner } from "../../ui/Avatar";

interface MessageInputProps {
  planId: string;
}

export default function MessageInput({ planId }: MessageInputProps) {
  const sendMessage = usePlanStore((s) => s.sendMessage);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setText("");
    
    const ok = await sendMessage(planId, content);
    if (!ok) {
      setText(content); // rollback nếu lỗi
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border p-3 flex items-end gap-2 bg-bg-elevated">
      <textarea
        ref={inputRef}
        className="input flex-1 min-h-[40px] max-h-[120px] resize-none py-2.5 text-sm"
        placeholder="Nhập tin nhắn nhóm..."
        value={text}
        onChange={(e) => setText(e.target.value)}
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