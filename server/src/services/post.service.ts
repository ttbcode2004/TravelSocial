import { Prisma, Visibility } from "../generated/prisma/client";
import { prisma } from "../config/prisma";
import { forbidden, notFound } from "../utils/errors";
import type {
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  UpdateCommentDto,
  UpsertReactionDto,
  CursorPageDto,
  OffsetPageDto,
} from "../types/post.type";
import  {syncPostMedias, uploadMedias}  from "./cloudinary.service";

import {
  notifyReaction,
  notifyComment,
  notifyCommentReply,
  notifyPostShare,
} from "../triggers/notification.trigger";

// ─── Selector chung cho Post ──────────────────────────────────
// Dùng lại nhiều nơi, tránh over-fetch
// Khi query User
// → chỉ lấy 4 field này
const postAuthorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  isVerified: true,
} satisfies Prisma.UserSelect;

// Đếm reactions theo từng loại và reaction của user hiện tại
function buildPostSelect(viewerId?: string) {
  return {
    id: true,
    content: true,
    mediaUrls: true,
    visibility: true,
    createdAt: true,
    updatedAt: true,
    user: { select: postAuthorSelect },
    _count: {
      select: {
        reactions: true,
        comments: true,
        shares: true,
      },
    },
    // reaction của người đang xem
    reactions: viewerId
      ? { where: { userId: viewerId }, select: { type: true } }
      : false,
  } satisfies Prisma.PostSelect;
}

// Format post trả về client
function formatPost(post: any, viewerId?: string) {
  const { reactions, _count, ...rest } = post;
  return {
    ...rest,
    counts: {
      reactions: _count.reactions,
      comments: _count.comments,
      shares: _count.shares,
    },
    viewerReaction: viewerId ? (reactions?.[0]?.type ?? null) : undefined,
  };
}

// ─── Visibility filter ────────────────────────────────────────
// Trả về điều kiện Prisma WHERE để lọc bài theo quyền xem

async function buildVisibilityFilter(
  viewerId?: string
): Promise<Prisma.PostWhereInput> {
  if (!viewerId) {
    // chưa đăng nhập → chỉ xem PUBLIC
    return { visibility: Visibility.PUBLIC };
  }

  // Lấy danh sách bạn bè đã accepted
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  const friendIds = friendships.map((f) =>
    f.requesterId === viewerId ? f.addresseeId : f.requesterId
  );

  return {
    OR: [
      // Bài public của tất cả
      { visibility: Visibility.PUBLIC },
      // Bài FRIENDS của bạn bè
      { visibility: Visibility.FRIENDS, userId: { in: friendIds } },
      // Bài PRIVATE / FRIENDS của chính mình
      { userId: viewerId },
    ],
  };
}

// ─── POSTS CRUD ───────────────────────────────────────────────

export async function createPost(
  userId: string,
  dto: CreatePostDto,
  files: Express.Multer.File[]
) {
  const uploaded = await uploadMedias(files);

  const mediaUrls = uploaded.map((m) => m.url);

  const post = await prisma.post.create({
    data: {
      userId,
      content: dto.content,
      mediaUrls,
      visibility: dto.visibility,
    },
    select: buildPostSelect(userId),
  });

  return formatPost(post, userId);
}

export async function updatePost(
  postId: string,
  userId: string,
  dto: UpdatePostDto,
  files: Express.Multer.File[]
) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw notFound("Bài viết không tồn tại");
  }

  if (post.userId !== userId) {
    throw forbidden("Bạn không có quyền chỉnh sửa bài này");
  }

  const uploadFiles = files || [];

  // ===== MEDIA LOGIC (CLEAN) =====
  const finalMediaUrls = await syncPostMedias(
    post.mediaUrls,
    dto.keepMediaUrls,
    uploadFiles
  );

  // ===== UPDATE DB =====
  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      ...(dto.content !== undefined && {
        content: dto.content,
      }),

      ...(dto.visibility !== undefined && {
        visibility: dto.visibility,
      }),

      mediaUrls: finalMediaUrls,
    },

    select: buildPostSelect(userId),
  });

  return formatPost(updated, userId);
}

export async function getPostById(postId: string, viewerId?: string) {
  const visibilityFilter = await buildVisibilityFilter(viewerId);

  const post = await prisma.post.findFirst({
    where: { id: postId, ...visibilityFilter },
    select: buildPostSelect(viewerId),
  });

  if (!post) throw notFound("Bài viết không tồn tại hoặc bạn không có quyền xem");
  return formatPost(post, viewerId);
}


export async function deletePost(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw notFound("Bài viết không tồn tại");
  if (post.userId !== userId) throw forbidden("Bạn không có quyền xoá bài này");

  await prisma.post.delete({ where: { id: postId } });
  return { message: "Đã xoá bài viết" };
}

// ─── FEED ─────────────────────────────────────────────────────

export async function getFeed(viewerId: string, pagination: CursorPageDto) {
  const { cursor, limit } = pagination;
  const visibilityFilter = await buildVisibilityFilter(viewerId);

  const posts = await prisma.post.findMany({
    where: visibilityFilter,
    orderBy: { createdAt: "desc" },
    take: limit + 1, // lấy thêm 1 để biết còn trang kế không
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // bỏ qua chính cursor
    }),
    select: buildPostSelect(viewerId),
  });

  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, limit) : posts;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return {
    items: items.map((p) => formatPost(p, viewerId)),
    nextCursor,
    hasNextPage,
  };
}

// Lấy bài của một user cụ thể
export async function getUserPosts(
  targetUserId: string,
  viewerId: string | undefined,
  pagination: CursorPageDto
) {
  const { cursor, limit } = pagination;
  const visibilityFilter = await buildVisibilityFilter(viewerId);

  const posts = await prisma.post.findMany({
    where: {
      userId: targetUserId,
      AND: [visibilityFilter],
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: buildPostSelect(viewerId),
  });

  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, limit) : posts;

  return {
    items: items.map((p) => formatPost(p, viewerId)),
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

// ─── REACTIONS ────────────────────────────────────────────────

export async function upsertReaction(
  postId: string,
  userId: string,
  dto: UpsertReactionDto
) {
  // Kiểm tra bài tồn tại
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw notFound("Bài viết không tồn tại");

  // Upsert: nếu đã react thì đổi loại, chưa thì tạo mới
  const reaction = await prisma.reaction.upsert({
    where: { userId_postId: { userId, postId } },
    update: { type: dto.type },
    create: { userId, postId, type: dto.type },
    select: { type: true, createdAt: true },
  });

  // Trả về tổng số reaction
  const counts = await getReactionCounts(postId);

  notifyReaction(userId, post.userId, postId, dto.type).catch(() => {});

  return { reaction, counts };
}

export async function removeReaction(postId: string, userId: string) {
  const existing = await prisma.reaction.findUnique({
    where: { userId_postId: { userId, postId } },
  });
  if (!existing) throw notFound("Bạn chưa react bài này");

  await prisma.reaction.delete({
    where: { userId_postId: { userId, postId } },
  });

  const counts = await getReactionCounts(postId);
  return { counts };
}

export async function getReactionCounts(postId: string) {
  const reactions = await prisma.reaction.groupBy({
    by: ["type"],
    where: { postId },
    _count: { type: true },
  });

  return reactions.reduce(
    (acc, r) => ({ ...acc, [r.type]: r._count.type }),
    {} as Record<string, number>
  );
}

export async function getReactionUsers(
  postId: string,
  pagination: OffsetPageDto
) {
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const [reactions, total] = await Promise.all([
    prisma.reaction.findMany({
      where: { postId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        type: true,
        createdAt: true,
        user: { select: postAuthorSelect },
      },
    }),
    prisma.reaction.count({ where: { postId } }),
  ]);

  return {
    items: reactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── COMMENTS ────────────────────────────────────────────────

const replySelect = {
  id: true,
  content: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: postAuthorSelect,
  },
} satisfies Prisma.CommentSelect;

const commentSelect = {
  id: true,
  content: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,

  user: {
    select: postAuthorSelect,
  },

  replies: {
    orderBy: {
      createdAt: "asc",
    },

    select: replySelect,
  },

  _count: {
    select: {
      replies: true,
    },
  },
} satisfies Prisma.CommentSelect;

export async function createComment(
  postId: string,
  userId: string,
  dto: CreateCommentDto
) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw notFound("Bài viết không tồn tại");

  // Nếu là reply, kiểm tra comment cha
  if (dto.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: dto.parentId },
    });
    if (!parent || parent.postId !== postId) {
      throw notFound("Comment cha không tồn tại");
    }
    // Chỉ hỗ trợ 1 cấp reply (không reply lồng nhau vô hạn)
    if (parent.parentId) {
      dto.parentId = parent.parentId; // flatten về cấp 1
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      content: dto.content,
      parentId: dto.parentId ?? null,
    },
    select: commentSelect,
  });

  // Notify post owner
  notifyComment(userId, post.userId, postId, comment.id, dto.content).catch(() => {});
 
  // Notify parent comment owner if it's a reply
  if (dto.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: dto.parentId },
      select: { userId: true },
    });
    if (parent && parent.userId !== userId) {
      notifyCommentReply(userId, parent.userId, postId, comment.id, dto.content).catch(() => {});
    }
  }
 

  return comment;
}

export async function getComments(postId: string, pagination: CursorPageDto) {
  const { cursor, limit } = pagination;

  // Chỉ lấy top-level comments (parentId = null)
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: commentSelect,
  });

  const hasNextPage = comments.length > limit;
  const items = hasNextPage ? comments.slice(0, limit) : comments;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function getReplies(commentId: string, pagination: CursorPageDto) {
  const { cursor, limit } = pagination;

  const replies = await prisma.comment.findMany({
    where: { parentId: commentId },
    orderBy: { createdAt: "asc" },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: commentSelect,
  });

  const hasNextPage = replies.length > limit;
  const items = hasNextPage ? replies.slice(0, limit) : replies;

  return {
    items,
    nextCursor: hasNextPage ? items[items.length - 1].id : null,
    hasNextPage,
  };
}

export async function updateComment(
  commentId: string,
  userId: string,
  dto: UpdateCommentDto
) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw notFound("Bình luận không tồn tại");
  if (comment.userId !== userId) throw forbidden("Bạn không có quyền sửa bình luận này");

  return prisma.comment.update({
    where: { id: commentId },
    data: { content: dto.content },
    select: commentSelect,
  });
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw notFound("Bình luận không tồn tại");
  if (comment.userId !== userId) throw forbidden("Bạn không có quyền xoá bình luận này");

  // Xoá luôn các reply
  await prisma.comment.deleteMany({ where: { parentId: commentId } });
  await prisma.comment.delete({ where: { id: commentId } });

  return { message: "Đã xoá bình luận" };
}

// ─── SHARES ───────────────────────────────────────────────────

export async function sharePost(postId: string, userId: string, note?: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw notFound("Bài viết không tồn tại");
  if (post.userId === userId) throw forbidden("Bạn không thể chia sẻ bài của chính mình");

  // Mỗi user chỉ share 1 lần (upsert không có → tạo mới, nếu muốn update note)
  const existing = await prisma.share.findFirst({ where: { postId, userId } });
  if (existing) {
    // update note nếu cần
    const updated = await prisma.share.update({
      where: { id: existing.id },
      data: { note: note ?? null },
      select: { id: true, note: true, createdAt: true },
    });
    return { share: updated, isNew: false };
  }

  const share = await prisma.share.create({
    data: { postId, userId, note: note ?? null },
    select: { id: true, note: true, createdAt: true },
  });

  if (!existing) {
    notifyPostShare(userId, post.userId, postId).catch(() => {});
  }
  
  return { share, isNew: true };
}