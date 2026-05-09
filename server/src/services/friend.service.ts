import { FriendshipStatus, Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { badRequest, conflict, forbidden, notFound } from "../utils/errors";
import type { CursorPageDto, FriendshipStatusView, SearchDto } from "../types/friend.type";
import {
  notifyFriendRequest,
  notifyFriendAccepted,
} from "../triggers/notification.trigger";

// ─── Selector ─────────────────────────────────────────────────

const userPreview = {
  id: true,
  username: true,
  avatarUrl: true,
  bio: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

// ─── Helpers ──────────────────────────────────────────────────

// Tìm friendship giữa 2 người (bất kỳ chiều nào)
async function findFriendship(userAId: string, userBId: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userAId, addresseeId: userBId },
        { requesterId: userBId, addresseeId: userAId },
      ],
    },
  });
}

// Trả về danh sách friendId của một user (chỉ ACCEPTED)
export async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );
}

// ─── Send Request ─────────────────────────────────────────────

export async function sendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    throw badRequest("Bạn không thể kết bạn với chính mình");
  }

  // Kiểm tra người nhận có tồn tại không
  const addressee = await prisma.user.findUnique({
    where: { id: addresseeId },
    select: userPreview,
  });
  if (!addressee) throw notFound("Người dùng không tồn tại");

  const existing = await findFriendship(requesterId, addresseeId);

  if (existing) {
    if (existing.status === "ACCEPTED") {
      throw conflict("Hai người đã là bạn bè", "ALREADY_FRIENDS");
    }
    if (existing.status === "BLOCKED") {
      // Ẩn lý do thực sự (không tiết lộ ai block ai)
      throw forbidden("Không thể gửi lời mời kết bạn");
    }
    if (existing.status === "PENDING") {
      // Người kia đã gửi request cho mình → tự động accept
      if (existing.addresseeId === requesterId) {
        return acceptRequest(requesterId, existing.id);
      }
      throw conflict("Đã gửi lời mời kết bạn trước đó", "REQUEST_SENT");
    }
    if (existing.status === "DECLINED") {
      // Cho phép gửi lại sau khi bị từ chối
      await prisma.friendship.delete({ where: { id: existing.id } });
    }
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId, addresseeId, status: "PENDING" },
    include: { addressee: { select: userPreview } },
  });

  notifyFriendRequest(requesterId, addresseeId, friendship.id).catch(() => {});

  return {
    message: `Đã gửi lời mời kết bạn đến ${addressee.username}`,
    friendship,
  };
}

// ─── Accept ───────────────────────────────────────────────────

export async function acceptRequest(userId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
    include: { requester: { select: userPreview } },
  });

  if (!friendship) throw notFound("Lời mời kết bạn không tồn tại");
  if (friendship.addresseeId !== userId) throw forbidden("Không có quyền chấp nhận lời mời này");
  if (friendship.status !== "PENDING") {
    throw badRequest("Lời mời kết bạn không còn hiệu lực");
  }

  const updated = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "ACCEPTED" },
    include: { requester: { select: userPreview } },
  });

  notifyFriendAccepted(userId, friendship.requesterId, friendshipId).catch(() => {});

  return {
    message: `Đã chấp nhận lời mời kết bạn từ ${updated.requester.username}`,
    friendship: updated,
  };
}

// ─── Decline ──────────────────────────────────────────────────

export async function declineRequest(userId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) throw notFound("Lời mời kết bạn không tồn tại");
  if (friendship.addresseeId !== userId) throw forbidden("Không có quyền từ chối lời mời này");
  if (friendship.status !== "PENDING") {
    throw badRequest("Lời mời kết bạn không còn hiệu lực");
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "DECLINED" },
  });

  return { message: "Đã từ chối lời mời kết bạn" };
}

// ─── Cancel sent request ──────────────────────────────────────

export async function cancelRequest(userId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship) throw notFound("Lời mời kết bạn không tồn tại");
  if (friendship.requesterId !== userId) throw forbidden("Không có quyền huỷ lời mời này");
  if (friendship.status !== "PENDING") {
    throw badRequest("Lời mời kết bạn không còn ở trạng thái chờ");
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });
  return { message: "Đã huỷ lời mời kết bạn" };
}

// ─── Unfriend ─────────────────────────────────────────────────

export async function unfriend(userId: string, targetUserId: string) {
  const friendship = await findFriendship(userId, targetUserId);

  if (!friendship || friendship.status !== "ACCEPTED") {
    throw notFound("Hai người không phải là bạn bè");
  }

  await prisma.friendship.delete({ where: { id: friendship.id } });
  return { message: "Đã huỷ kết bạn" };
}

// ─── Block ────────────────────────────────────────────────────

export async function blockUser(blockerId: string, targetUserId: string) {
  if (blockerId === targetUserId) throw badRequest("Không thể tự chặn chính mình");

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw notFound("Người dùng không tồn tại");

  const existing = await findFriendship(blockerId, targetUserId);

  if (existing) {
    if (existing.status === "BLOCKED" && existing.requesterId === blockerId) {
      throw conflict("Bạn đã chặn người này", "ALREADY_BLOCKED");
    }
    // Xoá friendship cũ (dù PENDING/ACCEPTED/BLOCKED_BY) rồi tạo BLOCKED mới
    await prisma.friendship.delete({ where: { id: existing.id } });
  }

  await prisma.friendship.create({
    data: { requesterId: blockerId, addresseeId: targetUserId, status: "BLOCKED" },
  });

  return { message: `Đã chặn ${target.username}` };
}

export async function unblockUser(blockerId: string, targetUserId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      requesterId: blockerId,
      addresseeId: targetUserId,
      status: "BLOCKED",
    },
  });

  if (!friendship) throw notFound("Bạn chưa chặn người này");

  await prisma.friendship.delete({ where: { id: friendship.id } });
  return { message: "Đã bỏ chặn" };
}

// ─── Get status ───────────────────────────────────────────────

export async function getFriendshipStatus(
  viewerId: string,
  targetUserId: string
): Promise<{ status: FriendshipStatusView; friendshipId: string | null }> {
  if (viewerId === targetUserId) {
    return { status: "NONE", friendshipId: null };
  }

  const friendship = await findFriendship(viewerId, targetUserId);
  if (!friendship) return { status: "NONE", friendshipId: null };

  const { status, requesterId, id } = friendship;

  if (status === "ACCEPTED") return { status: "ACCEPTED", friendshipId: id };

  if (status === "BLOCKED") {
    return {
      status: requesterId === viewerId ? "BLOCKED" : "BLOCKED_BY",
      friendshipId: id,
    };
  }

  if (status === "PENDING") {
    return {
      status: requesterId === viewerId ? "PENDING_SENT" : "PENDING_RECEIVED",
      friendshipId: id,
    };
  }

  return { status: "NONE", friendshipId: null };
}

// ─── List friends ─────────────────────────────────────────────

export async function getFriends(userId: string, dto: SearchDto) {
  const { q, cursor, limit } = dto;

  // Lấy tất cả friendshipId đã accept
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true, id: true },
  });

  const friendIds = friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );

  if (friendIds.length === 0) {
    return { items: [], nextCursor: null, hasNextPage: false, total: 0 };
  }

  const where: Prisma.UserWhereInput = {
    id: { in: friendIds },
    ...(q && {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { username: "asc" },
      select: userPreview,
    }),
    prisma.user.count({ where }),
  ]);

  const hasNextPage = users.length > limit;
  const items = hasNextPage ? users.slice(0, limit) : users;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
    total,
  };
}

// ─── Pending requests ─────────────────────────────────────────

export async function getReceivedRequests(userId: string, dto: CursorPageDto) {
  const { cursor, limit } = dto;

  const requests = await prisma.friendship.findMany({
    where: { addresseeId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      createdAt: true,
      requester: { select: userPreview },
    },
  });

  const hasNextPage = requests.length > limit;
  const items = hasNextPage ? requests.slice(0, limit) : requests;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function getSentRequests(userId: string, dto: CursorPageDto) {
  const { cursor, limit } = dto;

  const requests = await prisma.friendship.findMany({
    where: { requesterId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      createdAt: true,
      addressee: { select: userPreview },
    },
  });

  const hasNextPage = requests.length > limit;
  const items = hasNextPage ? requests.slice(0, limit) : requests;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

// ─── Blocked users ────────────────────────────────────────────

export async function getBlockedUsers(userId: string, dto: CursorPageDto) {
  const { cursor, limit } = dto;

  const blocked = await prisma.friendship.findMany({
    where: { requesterId: userId, status: "BLOCKED" },
    orderBy: { updatedAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      updatedAt: true,
      addressee: { select: userPreview },
    },
  });

  const hasNextPage = blocked.length > limit;
  const items = hasNextPage ? blocked.slice(0, limit) : blocked;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

// ─── Mutual friends ───────────────────────────────────────────

export async function getMutualFriends(
  userId: string,
  targetUserId: string,
  dto: CursorPageDto
) {
  const [myFriendIds, theirFriendIds] = await Promise.all([
    getFriendIds(userId),
    getFriendIds(targetUserId),
  ]);

  const mutualIds = myFriendIds.filter((id) => theirFriendIds.includes(id));

  if (mutualIds.length === 0) {
    return { items: [], nextCursor: null, hasNextPage: false, total: 0 };
  }

  const { cursor, limit } = dto;

  const users = await prisma.user.findMany({
    where: { id: { in: mutualIds } },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { username: "asc" },
    select: userPreview,
  });

  const hasNextPage = users.length > limit;
  const items = hasNextPage ? users.slice(0, limit) : users;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
    total: mutualIds.length,
  };
}

// ─── Friend suggestions ───────────────────────────────────────
// Gợi ý: bạn của bạn chưa kết bạn, sắp xếp theo số mutual friends giảm dần

export async function getFriendSuggestions(userId: string, limit = 20) {
  const myFriendIds = await getFriendIds(userId);

  // Lấy tất cả friendship của bạn bè mình
  const foafFriendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: { in: myFriendIds } },
        { addresseeId: { in: myFriendIds } },
      ],
    },
    select: { requesterId: true, addresseeId: true },
  });

  // Đếm số mutual friends cho mỗi candidate
  const mutualCount = new Map<string, number>();

  for (const f of foafFriendships) {
    const candidateId =
      myFriendIds.includes(f.requesterId) ? f.addresseeId : f.requesterId;

    // Loại bỏ: chính mình, đã là bạn, đang pending
    if (candidateId === userId || myFriendIds.includes(candidateId)) continue;

    mutualCount.set(candidateId, (mutualCount.get(candidateId) ?? 0) + 1);
  }

  if (mutualCount.size === 0) {
    // Fallback: gợi ý người dùng mới nhất chưa kết bạn
    const existingRelations = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });

    const excludeIds = new Set<string>([userId]);
    for (const f of existingRelations) {
      excludeIds.add(f.requesterId);
      excludeIds.add(f.addresseeId);
    }

    const users = await prisma.user.findMany({
      where: { id: { notIn: [...excludeIds] } },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { ...userPreview },
    });

    return users.map((u) => ({ ...u, mutualFriendsCount: 0 }));
  }

  // Sắp xếp theo mutual count
  const sortedCandidates = [...mutualCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const candidateIds = sortedCandidates.map(([id]) => id);

  const users = await prisma.user.findMany({
    where: { id: { in: candidateIds } },
    select: userPreview,
  });

  // Gắn lại mutual count
  const userMap = new Map(users.map((u) => [u.id, u]));

  return sortedCandidates
    .map(([id, count]) => ({
      ...userMap.get(id)!,
      mutualFriendsCount: count,
    }))
    .filter((u) => u.id); // loại undefined nếu user bị xoá
}