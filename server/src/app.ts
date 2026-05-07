import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";

import authRoutes from "./routes/auth.routes";

const app = express();

// MIDDLEWARES
app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true, // cho phép gửi cookies cross-origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}))

// Giới hạn kích thước 10 megabytes JSON body để tránh tấn công từ chối dịch vụ (DoS) bằng cách gửi payload quá lớn. 
// Nếu không giới hạn, một attacker có thể gửi một request với body rất lớn, làm tiêu tốn tài nguyên
// 413 Payload Too Large 
app.use(express.json({ limit: "10mb" }));
// Parse dữ liệu từ HTML form.
app.use(express.urlencoded({ extended: true }));
// Đọc cookie từ request headers. Cookie: token=abc123 => middleware => req.cookies.token
app.use(cookieParser());
app.use(morgan("dev"));

// ROUTES
app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: env.NODE_ENV });
});

app.use("/api/auth", authRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route không tồn tại" });
});

app.use(errorMiddleware);

export default app;