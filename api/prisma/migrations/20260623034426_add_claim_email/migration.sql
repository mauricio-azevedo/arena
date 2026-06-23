-- CreateEnum
CREATE TYPE "ClaimEmailStatus" AS ENUM ('PENDING', 'DECLINED');

-- AlterEnum: email-anchored claim notifications (old CLAIM_* values kept, deprecated in place)
ALTER TYPE "NotificationType" ADD VALUE 'CLAIM_OFFER';
ALTER TYPE "NotificationType" ADD VALUE 'CLAIM_OFFER_DECLINED';

-- AlterTable: email anchor on stubs
ALTER TABLE "GroupMember"
  ADD COLUMN "claimEmail" TEXT,
  ADD COLUMN "claimEmailStatus" "ClaimEmailStatus",
  ADD COLUMN "claimEmailNotifiedAt" TIMESTAMP(3);

-- CreateIndex: one anchored email per stub per group (Postgres ignores NULLs)
CREATE UNIQUE INDEX "GroupMember_groupId_claimEmail_key" ON "GroupMember"("groupId", "claimEmail");

-- CreateIndex: lookup on registration
CREATE INDEX "GroupMember_claimEmail_idx" ON "GroupMember"("claimEmail");
