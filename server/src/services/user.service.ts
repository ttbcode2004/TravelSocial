// services/user.service.ts
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { badRequest, notFound } from "../utils/errors";
import type { UpdateProfileDto, SearchUsersDto } from "../types/user.type";

const userPreview = {
  id: true,
  username: true,
  avatarUrl: true,
  coverUrl: true,
  bio: true,
  isVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

// ─── Get User ─────────────────────────────────────────────────

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: userPreview,
  });

  if (!user) throw notFound("Không tìm thấy người dùng");
  return user;
}

export async function getUserProfile(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: userPreview,
  });

  if (!user) throw notFound("Không tìm thấy người dùng");
  return user;
}

// ─── Update Profile ───────────────────────────────────────────

export async function updateProfile(userId: string, dto: UpdateProfileDto) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      bio: dto.bio ?? undefined,
      avatarUrl: dto.avatarUrl,
      coverUrl: dto.coverUrl,
    },
    select: userPreview,
  });

  return updated;
}

// ─── Search Users ─────────────────────────────────────────────

export async function searchUsers(dto: SearchUsersDto, excludeUserId?: string) {
  const { q, cursor, limit } = dto;

  const users = await prisma.user.findMany({
    where: {
      username: { contains: q, mode: "insensitive" },
      ...(excludeUserId && { id: { not: excludeUserId } }),
    },
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
  };
}

// ─── Get multiple users by IDs ────────────────────────────────

export async function getUsersByIds(userIds: string[]) {
  if (userIds.length === 0) return [];
  return prisma.user.findMany({
    where: { id: { in: userIds } },
    select: userPreview,
  });
}