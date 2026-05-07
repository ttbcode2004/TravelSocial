import { Request, Response } from "express";
import { asyncHandler } from "../utils/errors";
import {
  CreatePostSchema,
  UpdatePostSchema,
  CreateCommentSchema,
  UpdateCommentSchema,
  UpsertReactionSchema,
  CursorPageSchema,
  OffsetPageSchema,
  PostIdParam,
  UserIdParam,
  CommentIdParam,
} from "../types/post.type";
import * as PostsService from "../services/post.service";
import cloudinary from "../config/cloudinary";

// ─── Param Schemas ────────────────────────────────────────────

// ─── Posts ────────────────────────────────────────────────────

export const createPost = asyncHandler(
  async (req, res) => {
    const dto = CreatePostSchema.parse(req.body);

    const files =
      (req.files as Express.Multer.File[]) || [];

    const post =
      await PostsService.createPost(
        req.user!.sub,
        dto,
        files
      );

    res.status(201).json({
      success: true,
      data: post,
    });
  }
);


export const updatePost = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);
  
  const dto = UpdatePostSchema.parse(req.body);

  const files = (req.files as Express.Multer.File[]) || [];

  const post = await PostsService.updatePost(
    postId,
    req.user!.sub,
    dto,
    files
  );

  res.json({
    success: true,
    data: post,
  });
});

export const getPost = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);

  const post = await PostsService.getPostById(postId, req.user?.sub);
  res.json({ success: true, data: post });
});


export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);

  

  const result = await PostsService.deletePost(postId, req.user!.sub);
  res.json({ success: true, ...result });
});

export const getFeed = asyncHandler(async (req, res) => {
  const pagination = CursorPageSchema.parse(req.query);

  const result = await PostsService.getFeed(req.user!.sub, pagination);
  res.json({ success: true, ...result });
});

export const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = UserIdParam.parse(req.params);
  const pagination = CursorPageSchema.parse(req.query);

  const result = await PostsService.getUserPosts(
    userId,
    req.user?.sub,
    pagination
  );

  res.json({ success: true, ...result });
});

// ─── Reactions ────────────────────────────────────────────────

export const upsertReaction = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);
  const dto = UpsertReactionSchema.parse(req.body);

  const result = await PostsService.upsertReaction(
    postId,
    req.user!.sub,
    dto
  );

  res.json({ success: true, data: result });
});

export const removeReaction = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);

  const result = await PostsService.removeReaction(
    postId,
    req.user!.sub
  );

  res.json({ success: true, data: result });
});

export const getReactions = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);
  const pagination = OffsetPageSchema.parse(req.query);

  const result = await PostsService.getReactionUsers(postId, pagination);
  res.json({ success: true, ...result });
});

// ─── Comments ─────────────────────────────────────────────────

export const createComment = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);
  const dto = CreateCommentSchema.parse(req.body);

  const comment = await PostsService.createComment(
    postId,
    req.user!.sub,
    dto
  );

  res.status(201).json({ success: true, data: comment });
});

export const getComments = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);
  const pagination = CursorPageSchema.parse(req.query);

  const result = await PostsService.getComments(postId, pagination);
  res.json({ success: true, ...result });
});

export const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = CommentIdParam.parse(req.params);
  const pagination = CursorPageSchema.parse(req.query);

  const result = await PostsService.getReplies(commentId, pagination);
  res.json({ success: true, ...result });
});

export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = CommentIdParam.parse(req.params);
  const dto = UpdateCommentSchema.parse(req.body);

  const comment = await PostsService.updateComment(
    commentId,
    req.user!.sub,
    dto
  );

  res.json({ success: true, data: comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = CommentIdParam.parse(req.params);

  const result = await PostsService.deleteComment(
    commentId,
    req.user!.sub
  );

  res.json({ success: true, ...result });
});

// ─── Shares ───────────────────────────────────────────────────

export const sharePost = asyncHandler(async (req, res) => {
  const { postId } = PostIdParam.parse(req.params);
  const { note } = req.body as { note?: string };

  const result = await PostsService.sharePost(
    postId,
    req.user!.sub,
    note
  );

  res.status(result.isNew ? 201 : 200).json({
    success: true,
    data: result,
  });
});