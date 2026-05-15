import { MessageType } from "../generated/prisma/client";

// ─── User ─────────────────────────────────────

export interface UserPreview {
  id: string;
  username: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

// ─── Message ──────────────────────────────────
// object message realtime
export interface MessagePayload {
  id: string;
  conversationId: string;
  content: string | null;
  mediaUrl?: string | null;
  type: MessageType;
  isDeleted: boolean;
  createdAt: string;
  sender: UserPreview;
}

// ─── Callback (FIX CỨNG TYPE SOCKET.IO) ───────
// là callback acknowledgement 
// Socket.IO hỗ trợ: socket.emit("event", data, callback)
// frontend: 
// socket.emit("message:send", data, (res) => {
//   console.log(res)
// })
// backend:
// socket.on("message:send", (data, cb) => {
//    cb({ success: true })
// })

export type Ack<T = any> = (res: T) => void;

// ─── Client → Server ─────────────────────────
// Frontend được phép emit gì.
export interface ClientToServerEvents {
  "message:send": (
    data: {
      conversationId: string;
      content?: string;
      mediaUrl?: string;
      type?: MessageType;
    },
    ack: Ack<{ success: true; message: MessagePayload } | { success: false; error: string }>
  ) => void;

  "message:delete": (
    data: { conversationId: string; messageId: string },
    ack: Ack<{ success: true } | { success: false; error: string }>
  ) => void;

  "conversation:read": (
    data: { conversationId: string },
    ack?: Ack<{ success: true } | { success: false; error: string }>
  ) => void;

  "typing:start": (data: { conversationId: string }) => void;
  "typing:stop": (data: { conversationId: string }) => void;

  "conversation:join": (
    data: { conversationId: string },
    ack: Ack<{ success: true } | { success: false; error: string }>
  ) => void;
}

// ─── Server → Client ─────────────────────────

export interface ServerToClientEvents {
  "message:new": (data: {
    conversationId: string;
    message: MessagePayload;
  }) => void;

  "message:deleted": (data: {
    conversationId: string;
    messageId: string;
    message: MessagePayload;
  }) => void;

  "conversation:seen": (data: {
    conversationId: string;
    userId: string;
    seenAt: string;
  }) => void;

  "typing:start": (data: {
    conversationId: string;
    userId: string;
    username: string;
  }) => void;

  "typing:stop": (data: {
    conversationId: string;
    userId: string;
  }) => void;

  "group:member_added": (data: {
    conversationId: string;
    users: UserPreview[];
  }) => void;

  "group:member_removed": (data: {
    conversationId: string;
    userId: string;
  }) => void;

  "group:member_left": (data: {
    conversationId: string;
    userId: string;
  }) => void;

  "group:promoted": (data: {
    conversationId: string;
    userId: string;
  }) => void;

  "group:updated": (data: {
    conversationId: string;
    name?: string;
    avatarUrl?: string | null;
  }) => void;

  "presence:online": (data: { userId: string }) => void;

  "presence:offline": (data: {
    userId: string;
    lastSeenAt: string;
  }) => void;

  error: (data: { message: string; code?: string }) => void;
}