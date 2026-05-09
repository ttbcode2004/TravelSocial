import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConversationStore, useActiveMessages, useTypingUsers } from "../../stores/conversation.store";
import { useUser } from "../../stores/auth.store";
import { usePresenceStore } from "../../stores/presence.store";
import Avatar, { EmptyState, Spinner } from "../../components/ui/Avatar";
import { cn, formatMessageTime, getConversationName } from "../../utils";
import { Send, Plus, MessageCircle, Trash2 } from "lucide-react";
import type { Conversation } from "../../types";

// ─── Conversation List Item ───────────────────────────────────

function ConvItem({ conv, active }: { conv: Conversation; active: boolean }) {
  const me = useUser();
  const isOnline = usePresenceStore((s) => s.isOnline);
  const navigate = useNavigate();
  const name = getConversationName(conv, me?.username ?? "");
  const other = conv.type === "PRIVATE"
    ? conv.members.find((m) => m.user.id !== me?.id)?.user
    : null;
  const online = other ? isOnline(other.id) : false;

  const lastMsg = conv.lastMessage;
  const isUnread = lastMsg && conv.lastReadAt
    ? new Date(lastMsg.createdAt) > new Date(conv.lastReadAt)
    : !!lastMsg;

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left",
        active ? "bg-primary-subtle" : "hover:bg-bg-muted"
      )}
      onClick={() => navigate(`/chat/${conv.id}`)}
    >
      <Avatar
        src={conv.type === "GROUP" ? conv.avatarUrl : other?.avatarUrl}
        name={name}
        size="md"
        online={conv.type === "PRIVATE" ? online : undefined}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm truncate", isUnread && !active ? "font-semibold text-fg" : "font-medium")}>
            {name}
          </span>
          {lastMsg && (
            <span className="text-xs text-fg-subtle flex-shrink-0">
              {formatMessageTime(lastMsg.createdAt)}
            </span>
          )}
        </div>
        {lastMsg && (
          <p className={cn(
            "text-xs truncate mt-0.5",
            isUnread && !active ? "text-fg font-medium" : "text-fg-muted"
          )}>
            {lastMsg.isDeleted ? "Tin nhắn đã bị xoá" : (lastMsg.content ?? "📎 Media")}
          </p>
        )}
      </div>
      {isUnread && !active && (
        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
      )}
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────────

function MessageBubble({ msg, isMine, showAvatar }: {
  msg: ReturnType<typeof useActiveMessages>[number];
  isMine: boolean;
  showAvatar: boolean;
}) {
  const [showTime, setShowTime] = useState(false);

  return (
    <div className={cn("flex items-end gap-2 group", isMine && "flex-row-reverse")}>
      {/* Avatar */}
      <div className="w-7 flex-shrink-0">
        {showAvatar && !isMine && (
          <Avatar src={msg.sender.avatarUrl} name={msg.sender.username} size="xs" />
        )}
      </div>

      <div className={cn("max-w-[65%] flex flex-col gap-1", isMine && "items-end")}>
        {showAvatar && !isMine && (
          <span className="text-xs text-fg-subtle ml-1">{msg.sender.username}</span>
        )}

        <div
          className={cn(
            "px-3 py-2 rounded-2xl text-sm cursor-pointer select-text",
            isMine
              ? "bg-primary text-primary-fg rounded-br-sm"
              : "bg-bg-muted text-fg rounded-bl-sm",
            msg.isDeleted && "italic opacity-60"
          )}
          onClick={() => setShowTime((t) => !t)}
        >
          {msg.isDeleted ? "Tin nhắn đã bị xoá" : (msg.content ?? "📎 Media")}
        </div>

        {showTime && (
          <span className="text-xs text-fg-subtle px-1 animate-fade-in">
            {formatMessageTime(msg.createdAt)}
          </span>
        )}
      </div>

      {/* Delete (mine only) */}
      {isMine && !msg.isDeleted && (
        <button className="opacity-0 group-hover:opacity-100 transition-opacity btn-icon p-1 text-fg-subtle hover:text-danger">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Message Input ────────────────────────────────────────────

function MessageInput({ conversationId }: { conversationId: string }) {
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
    typingTimer.current = setTimeout(() => stopTyping(conversationId), 2000);
  };

  const submit = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    stopTyping(conversationId);
    try {
      await sendMessage(conversationId, content);
    } catch {
      setText(content); // restore on fail
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div className="border-t border-border p-3 flex items-end gap-2 bg-bg-elevated">
      <textarea
        className="input flex-1 min-h-[40px] max-h-[120px] resize-none py-2.5"
        placeholder="Nhập tin nhắn..."
        value={text}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        rows={1}
      />
      <button
        className="btn-primary p-2.5 rounded-xl flex-shrink-0"
        onClick={submit}
        disabled={!text.trim() || sending}
      >
        {sending ? <Spinner className="w-4 h-4" /> : <Send size={18} />}
      </button>
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────

export default function ChatPage() {
  const { conversationId } = useParams();
  const me = useUser();
  const conversations = useConversationStore((s) => s.conversations);
  const fetchConversations = useConversationStore((s) => s.fetchConversations);
  const openConversation = useConversationStore((s) => s.openConversation);
  const isLoadingMessages = useConversationStore((s) => s.isLoadingMessages);
  const messages = useActiveMessages();
  const typing = useTypingUsers(conversationId ?? "");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (conversationId) openConversation(conversationId);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConv = conversations.find((c) => c.id === conversationId);
  const convName = activeConv ? getConversationName(activeConv, me?.username ?? "") : "";

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-bg-subtle">
        <div className="h-14 flex items-center justify-between px-4 border-b border-border">
          <h2 className="font-semibold">Tin nhắn</h2>
          <button className="btn-icon"><Plus size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <EmptyState
              icon={<MessageCircle size={32} />}
              title="Chưa có cuộc trò chuyện"
              description="Nhắn tin với bạn bè của bạn"
            />
          ) : (
            conversations.map((c) => (
              <ConvItem key={c.id} conv={c} active={c.id === conversationId} />
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      {conversationId && activeConv ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-14 flex items-center gap-3 px-4 border-b border-border bg-bg-elevated flex-shrink-0">
            <Avatar
              src={activeConv.type === "GROUP" ? activeConv.avatarUrl : activeConv.members.find((m) => m.user.id !== me?.id)?.user.avatarUrl}
              name={convName}
              size="sm"
            />
            <div>
              <p className="font-medium text-sm">{convName}</p>
              {typing.length > 0 && (
                <p className="text-xs text-primary animate-pulse">
                  {typing.map((u) => u.username).join(", ")} đang nhập...
                </p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {isLoadingMessages && (
              <div className="flex justify-center py-4"><Spinner /></div>
            )}
            {messages.map((msg, i) => {
              const isMine = msg.sender.id === me?.id;
              const prev = messages[i - 1];
              const showAvatar = !prev || prev.sender.id !== msg.sender.id;
              return (
                <MessageBubble key={msg.id} msg={msg} isMine={isMine} showAvatar={showAvatar} />
              );
            })}
            <div ref={bottomRef} />
          </div>

          <MessageInput conversationId={conversationId} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<MessageCircle size={48} />}
            title="Chọn một cuộc trò chuyện"
            description="Hoặc bắt đầu nhắn tin với ai đó"
          />
        </div>
      )}
    </div>
  );
}