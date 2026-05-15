// routes/user.route.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as UserController from "../controllers/user.controller";

const router = Router();

// Public routes
router.get("/:username", UserController.getUserProfile);

// Protected routes
router.get("/me", authenticate, UserController.getCurrentUser);
router.patch("/me", authenticate, UserController.updateProfile);
router.get("/search", authenticate, UserController.searchUsers);

export default router;