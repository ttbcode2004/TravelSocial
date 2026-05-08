import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { env } from "./env";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "./prisma";
import * as ConversationsService from "../services/conversation.service";
import * as PresenceService from "../services/presence.service";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  MessagePayload,
} from "../types/socket.type";
import { MessageType } from "../generated/prisma/client";

// ─── Typed Socket ─────────────────────────────────────────────

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents> & {
  userId: string;
  username: string;
};

type AppIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;

// ─── Module-level io ref ──────────────────────────────────────

let _io: AppIO | null = null;

export function getIO(): AppIO {
  if (!_io) throw new Error("Socket.IO chưa được khởi tạo");
  return _io;
}

// ─── Emit helpers (dùng từ REST controllers) ──────────────────

export function emitToConversation(
  conversationId: string,
  event: keyof ServerToClientEvents,
  data: unknown
) {
  _io?.to(`conv:${conversationId}`).emit(event as any, data);
}

export function emitToUser(
  userId: string,
  event: keyof ServerToClientEvents,
  data: unknown
) {
  _io?.to(`user:${userId}`).emit(event as any, data);
}

// ─── Setup ────────────────────────────────────────────────────

export function setupSocketIO(httpServer: HttpServer): AppIO {
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: { origin: env.CLIENT_URL, credentials: true },
      pingInterval: 25000,
      pingTimeout: 60000,
      transports: ["polling", "websocket"],
    }
  );

  _io = io;

  // ─── Auth Middleware ────────────────────────────────────────

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        socket.handshake.headers?.cookie
          ?.split(";")
          .find((c) => c.trim().startsWith("access_token="))
          ?.split("=")[1];

      if (!token) return next(new Error("UNAUTHORIZED"));

      const payload = verifyAccessToken(token);
      (socket as AppSocket).userId = payload.sub;
      (socket as AppSocket).username = payload.username;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  // ─── Connection ────────────────────────────────────────────

  io.on("connection", async (rawSocket) => {
    const socket = rawSocket as AppSocket;
    const { userId, username } = socket;

    console.log(`[WS] 🟢 ${username} connected — ${socket.id}`);

    // Personal notification room
    socket.join(`user:${userId}`);

    // Auto-join all conversation rooms
    const joinedConvIds = await joinUserConversations(socket);
    await joinUserPlanRooms(socket);

    // Presence: online
    const justCameOnline = PresenceService.userConnected(userId, socket.id);
    if (justCameOnline) {
      broadcastPresence(socket, joinedConvIds, "presence:online", { userId });
    }

    // ─── message:send ─────────────────────────────────────────

    socket.on("message:send", async (data, callback) => {
      try {
        const { conversationId, content, mediaUrl, type = MessageType.TEXT } = data;

        if (!conversationId) {
          return callback({ success: false, error: "Thiếu conversationId" });
        }
        if (!content && !mediaUrl) {
          return callback({ success: false, error: "Tin nhắn trống" });
        }

        const message = await ConversationsService.sendMessage(
          conversationId,
          userId,
          { content, mediaUrl, type }
        );

        // Broadcast đến tất cả (kể cả sender để sync multi-tab)
        io.to(`conv:${conversationId}`).emit("message:new", {
          conversationId,
          message: message as unknown as MessagePayload,
        });

        callback({ success: true, message: message as unknown as MessagePayload });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    // ─── message:delete ───────────────────────────────────────

    socket.on("message:delete", async (data, callback) => {
      try {
        const updated = await ConversationsService.deleteMessage(
          data.conversationId,
          data.messageId,
          userId
        );

        io.to(`conv:${data.conversationId}`).emit("message:deleted", {
          conversationId: data.conversationId,
          messageId: data.messageId,
          message: updated as unknown as MessagePayload,
        });

        callback({ success: true });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    // ─── conversation:read ────────────────────────────────────

    socket.on("conversation:read", async (data, callback) => {
      try {
        await ConversationsService.markAsRead(data.conversationId, userId);

        socket.to(`conv:${data.conversationId}`).emit("conversation:seen", {
          conversationId: data.conversationId,
          userId,
          seenAt: new Date().toISOString(),
        });

        callback?.({ success: true });
      } catch (err: any) {
        callback?.({ success: false, error: err.message });
      }
    });

    // ─── typing ───────────────────────────────────────────────

    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

    socket.on("typing:start", ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit("typing:start", {
        conversationId,
        userId,
        username,
      });

      // Auto-clear sau 5s nếu client crash
      clearTimeout(typingTimers.get(conversationId));
      typingTimers.set(
        conversationId,
        setTimeout(() => {
          socket.to(`conv:${conversationId}`).emit("typing:stop", {
            conversationId,
            userId,
          });
          typingTimers.delete(conversationId);
        }, 5000)
      );
    });

    socket.on("typing:stop", ({ conversationId }) => {
      clearTimeout(typingTimers.get(conversationId));
      typingTimers.delete(conversationId);
      socket.to(`conv:${conversationId}`).emit("typing:stop", {
        conversationId,
        userId,
      });
    });

    // ─── conversation:join ────────────────────────────────────

    socket.on("conversation:join", async ({ conversationId }, callback) => {
      try {
        const member = await prisma.conversationMember.findUnique({
          where: { conversationId_userId: { conversationId, userId } },
        });

        if (!member) {
          return callback({ success: false, error: "Bạn không phải thành viên" });
        }

        socket.join(`conv:${conversationId}`);
        callback({ success: true });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    });

    // ─── disconnect ───────────────────────────────────────────

    socket.on("disconnect", (reason) => {
      // Clear tất cả typing timers
      for (const [convId, timer] of typingTimers) {
        clearTimeout(timer);
        socket.to(`conv:${convId}`).emit("typing:stop", {
          conversationId: convId,
          userId,
        });
      }
      typingTimers.clear();

      // Presence: offline
      const justWentOffline = PresenceService.userDisconnected(userId, socket.id);
      if (justWentOffline) {
        broadcastPresence(socket, joinedConvIds, "presence:offline", {
          userId,
          lastSeenAt: new Date(),
        });
      }

      console.log(`[WS] 🔴 ${username} disconnected — ${reason}`);
    });
  });

  return io;
}

// ─── Helpers ──────────────────────────────────────────────────

async function joinUserConversations(socket: AppSocket): Promise<string[]> {
  const memberships = await prisma.conversationMember.findMany({
    where: { userId: socket.userId },
    select: { conversationId: true },
  });

  const ids = memberships.map((m) => m.conversationId);
  for (const id of ids) socket.join(`conv:${id}`);
  return ids;
}

function broadcastPresence(
  socket: AppSocket,
  conversationIds: string[],
  event: "presence:online" | "presence:offline",
  data: object
) {
  for (const convId of conversationIds) {
    socket.to(`conv:${convId}`).emit(event as any, data);
  }
}

async function joinUserPlanRooms(socket: AppSocket): Promise<void> {
  // Lấy tất cả plans mà user tham gia
  const [memberships, createdPlans] = await Promise.all([
    prisma.planMember.findMany({
      where: { userId: socket.userId },
      select: { planId: true },
    }),
    prisma.plan.findMany({
      where: { creatorId: socket.userId },
      select: { id: true },
    }),
  ]);
 
  const planIds = new Set([
    ...memberships.map((m) => m.planId),
    ...createdPlans.map((p) => p.id),
  ]);
 
  for (const id of planIds) {
    socket.join(`plan:${id}`);
  }
}
