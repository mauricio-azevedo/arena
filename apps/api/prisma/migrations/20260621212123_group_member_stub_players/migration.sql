-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "displayName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;
