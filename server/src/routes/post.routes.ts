import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.middleware";
import * as PostsController from "../controllers/post.controller";
import upload from "../middlewares/upload.middleware";

const router = Router();

// ─── Feed ─────────────────────────────────────────────────────
// GET  /api/posts/feed                  🔒 News feed cá nhân
router.get("/feed", authenticate, PostsController.getFeed);

// ─── Posts CRUD ───────────────────────────────────────────────
// POST /api/posts                       🔒 Tạo bài viết
router.post("/", authenticate,upload.array("media", 10), PostsController.createPost);

// GET  /api/posts/user/:userId          👁  Bài của 1 user (có thể xem khi chưa đăng nhập)
router.get("/user/:userId", optionalAuthenticate, PostsController.getUserPosts);

// GET  /api/posts/:postId               👁  Chi tiết 1 bài
router.get("/:postId", optionalAuthenticate, PostsController.getPost);

// PATCH /api/posts/:postId              🔒 Sửa bài (chỉ chủ sở hữu)
router.patch("/:postId", authenticate,upload.array("keepMediaUrls", 10), PostsController.updatePost);

// DELETE /api/posts/:postId             🔒 Xoá bài (chỉ chủ sở hữu)
router.delete("/:postId", authenticate, PostsController.deletePost);

// ─── Reactions ────────────────────────────────────────────────
// POST   /api/posts/:postId/reactions   🔒 React / đổi reaction
router.post("/:postId/reactions", authenticate, PostsController.upsertReaction);

// DELETE /api/posts/:postId/reactions   🔒 Bỏ reaction
router.delete("/:postId/reactions", authenticate, PostsController.removeReaction);

// GET    /api/posts/:postId/reactions   👁  Danh sách ai đã react
router.get("/:postId/reactions", optionalAuthenticate, PostsController.getReactions);

// ─── Comments ─────────────────────────────────────────────────
// POST /api/posts/:postId/comments      🔒 Thêm bình luận (có thể kèm parentId để reply)
router.post("/:postId/comments", authenticate, PostsController.createComment);

// GET  /api/posts/:postId/comments      👁  Lấy top-level comments (cursor paging)
router.get("/:postId/comments", optionalAuthenticate, PostsController.getComments);

// ─── Shares ───────────────────────────────────────────────────
// POST /api/posts/:postId/share         🔒 Chia sẻ bài viết
router.post("/:postId/share", authenticate, PostsController.sharePost);

export default router;