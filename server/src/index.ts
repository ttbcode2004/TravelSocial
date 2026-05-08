import http from "http";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { setupSocketIO } from "./config/socket";

async function bootstrap() {
  await prisma.$connect();
  console.log("✅ Kết nối database thành công");

  const httpServer = http.createServer(app);
  const io = setupSocketIO(httpServer);
  app.set("io", io);

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${env.PORT}`);
    console.log(`⚡ WebSocket (Socket.IO) sẵn sàng`);
    console.log(`📌 Môi trường: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((err) => {
  console.error("❌ Khởi động server thất bại:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Đang tắt server...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});