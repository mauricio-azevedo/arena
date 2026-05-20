-- DropForeignKey
ALTER TABLE "ActivityEvent" DROP CONSTRAINT "ActivityEvent_actorGroupMemberId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityEvent" DROP CONSTRAINT "ActivityEvent_matchId_fkey";

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorGroupMemberId_groupId_fkey" FOREIGN KEY ("actorGroupMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_matchId_groupId_fkey" FOREIGN KEY ("matchId", "groupId") REFERENCES "Match"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;
