import { create } from "zustand";
import { api } from "../lib/api";
import { onSocket, emitSocket } from "../lib/socket";
import type { Conversation, Message } from "../types";

interface TypingUser { userId: string; username: string; }

interface ConversationStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  nextCursor: Record<string, string | null>;
  typing: Record<string, TypingUser[]>;
  unreadTotal: number;
  isLoadingMessages: boolean;

  fetchConversations: () => Promise<void>;
  openConversation: (id: string) => void;
  fetchMessages: (conversationId: string, reset?: boolean) => Promise<void>;
  sendMessage: (conversationId: string, content: string, mediaUrl?: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
  createPrivateConversation: (targetUserId: string) => Promise<Conversation>;
  fetchUnreadCount: () => Promise<void>;
  initSocketListeners: () => () => void;
}

// ─── Stable empty references ──────────────────────────────────
// NEVER use [] or {} inline inside selectors — creates new reference every render

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_TYPING:   TypingUser[] = [];

// ─── Store ────────────────────────────────────────────────────

export const useConversationStore = create<ConversationStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  nextCursor: {},
  typing: {},
  unreadTotal: 0,
  isLoadingMessages: false,

  fetchConversations: async () => {
    const res = await api.get("/conversations");
    set({ conversations: res.data.items ?? [] });
  },

  openConversation: (id) => {
    // Guard: skip if already active — prevents cascading setState
    if (get().activeConversationId === id) return;
    set({ activeConversationId: id });
    get().fetchMessages(id, true);
    get().markAsRead(id);
  },

  fetchMessages: async (conversationId, reset = false) => {
    if (get().isLoadingMessages && !reset) return;
    set({ isLoadingMessages: true });
    try {
      const cursor = reset ? undefined : get().nextCursor[conversationId];
      const res = await api.get(`/conversations/${conversationId}/messages`, {
        params: { cursor, limit: 30 },
      });
      const { items, nextCursor } = res.data;
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: reset
            ? items
            : [...items, ...(state.messages[conversationId] ?? [])],
        },
        nextCursor: { ...state.nextCursor, [conversationId]: nextCursor },
      }));
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  sendMessage: async (conversationId, content, mediaUrl) => {
    return new Promise((resolve, reject) => {
      emitSocket("message:send", { conversationId, content, mediaUrl }, (res: any) => {
        if (res.success) resolve();
        else reject(new Error(res.error));
      });
    });
  },

  deleteMessage: async (conversationId, messageId) => {
    emitSocket("message:delete", { conversationId, messageId }, () => {});
  },

  markAsRead: (conversationId) => {
    emitSocket("conversation:read", { conversationId });
  },

  startTyping: (conversationId) => {
    emitSocket("typing:start", { conversationId });
  },

  stopTyping: (conversationId) => {
    emitSocket("typing:stop", { conversationId });
  },

  createPrivateConversation: async (targetUserId) => {
    const res = await api.post("/conversations/private", { targetUserId });
    const conv = res.data.data;
    set((state) => ({
      conversations: state.conversations.some((c) => c.id === conv.id)
        ? state.conversations
        : [conv, ...state.conversations],
    }));
    return conv;
  },

  fetchUnreadCount: async () => {
    const res = await api.get("/conversations/unread");
    set({ unreadTotal: res.data.data?.total ?? 0 });
  },

  initSocketListeners: () => {
    const offNew = onSocket<{ conversationId: string; message: Message }>(
      "message:new",
      ({ conversationId, message }) => {
        set((state) => {
          const existing = state.messages[conversationId];
          const isDup = existing?.some((m) => m.id === message.id) ?? false;

          // Always update conversation list with latest message
          const updatedConvs = state.conversations.map((c) =>
            c.id === conversationId ? { ...c, lastMessage: message } : c
          );
          updatedConvs.sort((a, b) => {
            const at = a.lastMessage?.createdAt ?? a.createdAt;
            const bt = b.lastMessage?.createdAt ?? b.createdAt;
            return new Date(bt).getTime() - new Date(at).getTime();
          });

          if (isDup) return { conversations: updatedConvs };

          return {
            conversations: updatedConvs,
            messages: {
              ...state.messages,
              [conversationId]: existing ? [...existing, message] : [message],
            },
          };
        });
      }
    );

    const offDeleted = onSocket<{ conversationId: string; messageId: string; message: Message }>(
      "message:deleted",
      ({ conversationId, message }) => {
        set((state) => {
          const existing = state.messages[conversationId];
          if (!existing) return {};
          return {
            messages: {
              ...state.messages,
              [conversationId]: existing.map((m) => m.id === message.id ? message : m),
            },
          };
        });
      }
    );

    const offTypingStart = onSocket<{ conversationId: string; userId: string; username: string }>(
      "typing:start",
      ({ conversationId, userId, username }) => {
        set((state) => {
          const current = state.typing[conversationId];
          if (current?.some((u) => u.userId === userId)) return {};
          return {
            typing: {
              ...state.typing,
              [conversationId]: current
                ? [...current, { userId, username }]
                : [{ userId, username }],
            },
          };
        });
      }
    );

    const offTypingStop = onSocket<{ conversationId: string; userId: string }>(
      "typing:stop",
      ({ conversationId, userId }) => {
        set((state) => {
          const current = state.typing[conversationId];
          if (!current) return {};
          const next = current.filter((u) => u.userId !== userId);
          if (next.length === current.length) return {}; // no change
          return { typing: { ...state.typing, [conversationId]: next } };
        });
      }
    );

    return () => { offNew(); offDeleted(); offTypingStart(); offTypingStop(); };
  },
}));

// ─── Stable selectors ─────────────────────────────────────────
// Return the SAME empty reference when key not found → no re-render

export const useActiveMessages = () =>
  useConversationStore((s) => {
    if (!s.activeConversationId) return EMPTY_MESSAGES;
    return s.messages[s.activeConversationId] ?? EMPTY_MESSAGES;
  });

export const useTypingUsers = (conversationId: string) =>
  useConversationStore((s) => s.typing[conversationId] ?? EMPTY_TYPING);