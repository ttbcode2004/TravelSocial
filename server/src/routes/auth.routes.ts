import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as AuthController from "../controllers/auth.controller";

const router = Router();

// ─── Email / Password ─────────────────────────────────────────
// POST /api/auth/register
router.post("/register", AuthController.register);

// GET  /api/auth/verify-email?token=xxx
router.get("/verify-email", AuthController.verifyEmail);

// POST /api/auth/resend-verification
router.post("/resend-verification", AuthController.resendVerification);

// POST /api/auth/login
router.post("/login", AuthController.login);

// POST /api/auth/logout
router.post("/logout", AuthController.logout);

// POST /api/auth/refresh     (dùng refresh_token cookie)
router.post("/refresh", AuthController.refresh);

// POST /api/auth/forgot-password
router.post("/forgot-password", AuthController.forgotPassword);

// POST /api/auth/reset-password
router.post("/reset-password", AuthController.resetPassword);

// POST /api/auth/change-password   (phải đăng nhập)
router.post("/change-password", authenticate, AuthController.changePassword);

// GET  /api/auth/me                (phải đăng nhập)
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
