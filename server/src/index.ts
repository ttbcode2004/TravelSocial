import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

async function bootstrap() {
  // Kiểm tra kết nối database
  await prisma.$connect();
  console.log("✅ Kết nối database thành công");

  app.listen(env.PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${env.PORT}`);
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