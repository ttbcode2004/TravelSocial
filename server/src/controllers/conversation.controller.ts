import { asyncHandler, badRequest } from "../utils/errors";
import {
  CreatePrivateConversationSchema,
  CreateGroupConversationSchema,
  UpdateGroupSchema,
  SendMessageSchema,
  CursorPageSchema,
  ConversationIdParam,
  UserIdParam,
  MessageIdParam,
} from "../types/conversation.type";
import * as ConversationsService from "../services/conversation.service";

import * as PresenceService from "../services/presence.service";
import { Request } from "express";

// ─── Conversations ────────────────────────────────────────────

export const listConversations = asyncHandler(async (req, res) => {
  const dto = CursorPageSchema.parse(req.query);
  const result = await ConversationsService.listConversations(req.user!.sub, dto);
  res.json({ success: true, ...result });
});

export const createPrivate = asyncHandler(async (req, res) => {
  const dto = CreatePrivateConversationSchema.parse(req.body);
  const result = await ConversationsService.createPrivateConversation(req.user!.sub, dto);
  res.status(result.isNew ? 201 : 200).json({ success: true, data: result.conversation });
});

export const createGroup = asyncHandler(async (req, res) => {
  const dto = CreateGroupConversationSchema.parse(req.body);
  const result = await ConversationsService.createGroupConversation(req.user!.sub, dto);
  res.status(201).json({ success: true, data: result });
});

export const getConversation = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const result = await ConversationsService.getConversation(
    conversationId,
    req.user!.sub
  );
  res.json({ success: true, data: result });
});

export const updateGroup = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const dto = UpdateGroupSchema.parse(req.body);
  const result = await ConversationsService.updateGroup(
    conversationId,
    req.user!.sub,
    dto
  );
  res.json({ success: true, data: result });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await ConversationsService.getUnreadCount(req.user!.sub);
  res.json({ success: true, data: result });
});

// ─── Members ──────────────────────────────────────────────────

export const addMembers = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const { userIds } = req.body as { userIds?: string[] };
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw badRequest("Vui lòng cung cấp danh sách userIds");
  }
  const result = await ConversationsService.addMembers(
    conversationId,
    req.user!.sub,
    userIds
  );
  res.json({ success: true, ...result });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const { userId } = UserIdParam.parse(req.params);
  const result = await ConversationsService.removeMember(
    conversationId,
    req.user!.sub,
    userId
  );
  res.json({ success: true, ...result });
});

export const leaveGroup = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const result = await ConversationsService.leaveGroup(
    conversationId,
    req.user!.sub
  );
  res.json({ success: true, ...result });
});

export const promoteToAdmin = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const { userId } = UserIdParam.parse(req.params);
  const result = await ConversationsService.promoteToAdmin(
    conversationId,
    req.user!.sub,
    userId
  );
  res.json({ success: true, ...result });
});

// ─── Messages ─────────────────────────────────────────────────

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const dto = SendMessageSchema.parse(req.body);
  const message = await ConversationsService.sendMessage(
    conversationId,
    req.user!.sub,
    dto
  );
  res.status(201).json({ success: true, data: message });
});

export const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const dto = CursorPageSchema.parse(req.query);
  const result = await ConversationsService.getMessages(
    conversationId,
    req.user!.sub,
    dto
  );
  res.json({ success: true, ...result });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const { messageId } = MessageIdParam.parse(req.params);
  const result = await ConversationsService.deleteMessage(
    conversationId,
    messageId,
    req.user!.sub
  );
  res.json({ success: true, data: result });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { conversationId } = ConversationIdParam.parse(req.params);
  const result = await ConversationsService.markAsRead(
    conversationId,
    req.user!.sub
  );
  res.json({ success: true, ...result });
});

// ─── Presence ─────────────────────────────────────────────────

export const getPresence = asyncHandler(async (req, res) => {
  const raw = req.query.userIds;

  const userIds = Array.isArray(raw)
    ? (raw as string[])
    : typeof raw === "string"
      ? [raw]
      : [];

  if (userIds.length === 0) {
    res.status(400).json({
      success: false,
      message: "Cần ít nhất 1 userId",
    });

    return;
  }

  const data = PresenceService.getPresenceMap(userIds);

  res.json({
    success: true,
    data,
  });
});