/**
 * notifications.triggers.ts
 *
 * Tập trung toàn bộ logic "ai cần nhận notification khi nào".
 * Import module này từ các service khác thay vì gọi createNotification trực tiếp.
 * Giúp dễ kiểm soát, test, và mở rộng (push / email) sau này.
 */

import { createNotification, createBulkNotifications } from "../services/notification.service";
import { getFriendIds } from "../services/friend.service";

// ─── Social ───────────────────────────────────────────────────

export async function notifyReaction(
  actorId: string,
  postOwnerId: string,
  postId: string,
  reactionType: string
) {
  await createNotification({
    recipientId: postOwnerId,
    actorId,
    type: "REACTION",
    entityId: postId,
    entityType: "POST",
    metadata: { reactionType },
  });
}

export async function notifyComment(
  actorId: string,
  postOwnerId: string,
  postId: string,
  commentId: string,
  preview: string
) {
  await createNotification({
    recipientId: postOwnerId,
    actorId,
    type: "COMMENT",
    entityId: postId,
    entityType: "POST",
    metadata: { commentId, preview: preview.slice(0, 100) },
  });
}

export async function notifyCommentReply(
  actorId: string,
  parentCommentOwnerId: string,
  postId: string,
  commentId: string,
  preview: string
) {
  await createNotification({
    recipientId: parentCommentOwnerId,
    actorId,
    type: "COMMENT_REPLY",
    entityId: commentId,
    entityType: "COMMENT",
    metadata: { postId, preview: preview.slice(0, 100) },
  });
}

export async function notifyPostShare(
  actorId: string,
  postOwnerId: string,
  postId: string
) {
  await createNotification({
    recipientId: postOwnerId,
    actorId,
    type: "POST_SHARE",
    entityId: postId,
    entityType: "POST",
  });
}

// ─── Friends ──────────────────────────────────────────────────

export async function notifyFriendRequest(
  requesterId: string,
  addresseeId: string,
  friendshipId: string
) {
  await createNotification({
    recipientId: addresseeId,
    actorId: requesterId,
    type: "FRIEND_REQUEST",
    entityId: friendshipId,
    entityType: "FRIENDSHIP",
  });
}

export async function notifyFriendAccepted(
  acceptorId: string,
  requesterId: string,
  friendshipId: string
) {
  await createNotification({
    recipientId: requesterId,
    actorId: acceptorId,
    type: "FRIEND_ACCEPTED",
    entityId: friendshipId,
    entityType: "FRIENDSHIP",
  });
}

// ─── Chat ─────────────────────────────────────────────────────

export async function notifyNewMessage(
  senderId: string,
  conversationId: string,
  memberIds: string[],   // tất cả members trừ sender
  preview: string
) {
  await createBulkNotifications(
    memberIds
      .filter((id) => id !== senderId)
      .map((recipientId) => ({
        recipientId,
        actorId: senderId,
        type: "NEW_MESSAGE" as const,
        entityId: conversationId,
        entityType: "MESSAGE" as const,
        metadata: { preview: preview.slice(0, 80) },
      }))
  );
}

// ─── Plans ────────────────────────────────────────────────────

export async function notifyPlanInvite(
  inviterId: string,
  inviteeIds: string[],
  planId: string,
  planTitle: string
) {
  await createBulkNotifications(
    inviteeIds.map((recipientId) => ({
      recipientId,
      actorId: inviterId,
      type: "PLAN_INVITE" as const,
      entityId: planId,
      entityType: "PLAN" as const,
      metadata: { planTitle },
    }))
  );
}

export async function notifyPlanUpdate(
  actorId: string,
  memberIds: string[],
  planId: string,
  planTitle: string,
  changeNote: string
) {
  await createBulkNotifications(
    memberIds
      .filter((id) => id !== actorId)
      .map((recipientId) => ({
        recipientId,
        actorId,
        type: "PLAN_UPDATE" as const,
        entityId: planId,
        entityType: "PLAN" as const,
        metadata: { planTitle, changeNote },
      }))
  );
}

export async function notifyTaskAssigned(
  assignerId: string,
  assigneeId: string,
  taskId: string,
  taskTitle: string,
  planId: string
) {
  await createNotification({
    recipientId: assigneeId,
    actorId: assignerId,
    type: "TASK_ASSIGNED",
    entityId: taskId,
    entityType: "TASK",
    metadata: { taskTitle, planId },
  });
}

export async function notifyTaskDone(
  completedById: string,
  assigneeId: string,
  taskId: string,
  taskTitle: string,
  planId: string
) {
  await createNotification({
    recipientId: assigneeId,
    actorId: completedById,
    type: "TASK_DONE",
    entityId: taskId,
    entityType: "TASK",
    metadata: { taskTitle, planId },
  });
}

// ─── Map ──────────────────────────────────────────────────────

export async function notifyLocationSaved(
  actorId: string,
  locationId: string,
  locationName: string
) {
  // Thông báo cho bạn bè khi ai đó lưu location mới (public)
  const friendIds = await getFriendIds(actorId);

  await createBulkNotifications(
    friendIds.map((recipientId) => ({
      recipientId,
      actorId,
      type: "LOCATION_SAVED" as const,
      entityId: locationId,
      entityType: "LOCATION" as const,
      metadata: { locationName },
    }))
  );
}