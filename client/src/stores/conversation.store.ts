import { create } from "zustand";
import { api } from "../lib/api";
import { onSocket, emitSocket } from "../lib/socket";
import type { Conversation, Message } from "../types";

interface TypingUser { userId: string; username: string; }

interface ConversationStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;         // conversationId → messages
  nextCursor: Record<string, string | null>;   // conversationId → cursor
  typing: Record<string, TypingUser[]>;        // conversationId → who's typing
  unreadTotal: number;
  isLoadingMessages: boolean;

  // Actions
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

  // Socket
  initSocketListeners: () => () => void;
}

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
    set({ conversations: res.data.items });
  },

  openConversation: (id) => {
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
    set({ unreadTotal: res.data.data.total });
  },

  initSocketListeners: () => {
    // New message
    const offNew = onSocket<{ conversationId: string; message: Message }>(
      "message:new",
      ({ conversationId, message }) => {
        set((state) => {
          const existing = state.messages[conversationId] ?? [];
          const isDup = existing.some((m) => m.id === message.id);
          const updatedMessages = isDup
            ? existing
            : [...existing, message];

          // Update lastMessage in conversation list
          const updatedConvs = state.conversations.map((c) =>
            c.id === conversationId ? { ...c, lastMessage: message } : c
          );

          // Sort conversations by last message
          updatedConvs.sort((a, b) => {
            const at = a.lastMessage?.createdAt ?? a.createdAt;
            const bt = b.lastMessage?.createdAt ?? b.createdAt;
            return new Date(bt).getTime() - new Date(at).getTime();
          });

          return {
            messages: { ...state.messages, [conversationId]: updatedMessages },
            conversations: updatedConvs,
          };
        });
      }
    );

    // Message deleted
    const offDeleted = onSocket<{ conversationId: string; messageId: string; message: Message }>(
      "message:deleted",
      ({ conversationId, message }) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: (state.messages[conversationId] ?? []).map((m) =>
              m.id === message.id ? message : m
            ),
          },
        }));
      }
    );

    // Typing start
    const offTypingStart = onSocket<{ conversationId: string; userId: string; username: string }>(
      "typing:start",
      ({ conversationId, userId, username }) => {
        set((state) => {
          const current = state.typing[conversationId] ?? [];
          const exists = current.some((u) => u.userId === userId);
          return {
            typing: {
              ...state.typing,
              [conversationId]: exists
                ? current
                : [...current, { userId, username }],
            },
          };
        });
      }
    );

    // Typing stop
    const offTypingStop = onSocket<{ conversationId: string; userId: string }>(
      "typing:stop",
      ({ conversationId, userId }) => {
        set((state) => ({
          typing: {
            ...state.typing,
            [conversationId]: (state.typing[conversationId] ?? []).filter(
              (u) => u.userId !== userId
            ),
          },
        }));
      }
    );

    return () => {
      offNew(); offDeleted(); offTypingStart(); offTypingStop();
    };
  },
}));

// Selectors
export const useActiveMessages = () =>
  useConversationStore((s) =>
    s.activeConversationId ? (s.messages[s.activeConversationId] ?? []) : []
  );

export const useTypingUsers = (conversationId: string) =>
  useConversationStore((s) => s.typing[conversationId] ?? []);