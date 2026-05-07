-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;
