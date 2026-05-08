import { Router } from "express";
import { authenticate, optionalAuthenticate } from "../middlewares/auth.middleware";
import * as PostsController from "../controllers/post.controller";

// Routes cho comment không gắn với post cụ thể
// Được mount ở /api/comments

const router = Router();

// Load replies của 1 comment
router.get("/replies/:commentId", optionalAuthenticate, PostsController.getReplies);

// Sửa comment
router.patch("/:commentId", authenticate, PostsController.updateComment);

// Xoá comment
router.delete("/:commentId", authenticate, PostsController.deleteComment);

export default router;