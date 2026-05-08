import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as AuthController from "../controllers/auth.controller";

const router = Router();

router.post("/register", AuthController.register);

// GET  /api/auth/verify-email?token=xxx
router.get("/verify-email", AuthController.verifyEmail);
router.post("/resend-verification", AuthController.resendVerification);

router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// POST /api/auth/refresh     (dùng refresh_token cookie)
router.post("/refresh", AuthController.refresh);

router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/change-password", authenticate, AuthController.changePassword);
router.get("/me", authenticate, AuthController.getMe);

// ─── Google OAuth ─────────────────────────────────────────────
// GET  /api/auth/google            → redirect đến Google
router.get("/google", AuthController.googleRedirect);

// GET  /api/auth/google/callback   → Google redirect về đây
router.get("/google/callback", AuthController.googleCallback);

// ─── GitHub OAuth ─────────────────────────────────────────────
// GET  /api/auth/github
router.get("/github", AuthController.githubRedirect);

// GET  /api/auth/github/callback
router.get("/github/callback", AuthController.githubCallback);

export default router;
