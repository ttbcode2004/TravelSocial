import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.middleware";
import * as PostsController from "../controllers/post.controller";
import upload from "../middlewares/upload.middleware";

const router = Router();

// ─── Feed ─────────────────────────────────────────────────────
// GET  /api/posts/feed                  🔒 News feed cá nhân
router.get("/feed", authenticate, PostsController.getFeed);

// ─── Posts CRUD ───────────────────────────────────────────────
router.post("/", authenticate,upload.array("mediaUrls", 10), PostsController.createPost);

router.get("/user/:userId", optionalAuthenticate, PostsController.getUserPosts);
router.get("/:postId", optionalAuthenticate, PostsController.getPost);
router.patch("/:postId", authenticate,upload.array("keepMediaUrls", 10), PostsController.updatePost);
router.delete("/:postId", authenticate, PostsController.deletePost);

// ─── Reactions ────────────────────────────────────────────────
router.post("/:postId/reactions", authenticate, PostsController.upsertReaction);
router.delete("/:postId/reactions", authenticate, PostsController.removeReaction);
router.get("/:postId/reactions", optionalAuthenticate, PostsController.getReactions);

// ─── Comments ─────────────────────────────────────────────────
router.post("/comments/:postId", authenticate, PostsController.createComment);

router.get("/comments/:postId", optionalAuthenticate, PostsController.getComments);

// ─── Shares ───────────────────────────────────────────────────
router.post("/:postId/share", authenticate, PostsController.sharePost);

export default router;
