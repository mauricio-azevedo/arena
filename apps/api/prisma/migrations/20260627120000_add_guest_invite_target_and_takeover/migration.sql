-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'GUEST_TAKEN_OVER';

-- AlterTable
ALTER TABLE "GroupInvite" ADD COLUMN "targetGroupMemberId" TEXT;

-- CreateIndex
CREATE INDEX "GroupInvite_targetGroupMemberId_idx" ON "GroupInvite"("targetGroupMemberId");

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_targetGroupMemberId_groupId_fkey" FOREIGN KEY ("targetGroupMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;
