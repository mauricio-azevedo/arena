/*
  Warnings:

  - You are about to drop the `ActivityEvent` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FeedItemType" AS ENUM ('GROUP_CREATED', 'MEMBER_JOINED', 'MATCH_CLOSE', 'MATCH_BLOWOUT', 'UPSET_WIN');

-- DropForeignKey
ALTER TABLE "ActivityEvent" DROP CONSTRAINT "ActivityEvent_actorGroupMemberId_groupId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityEvent" DROP CONSTRAINT "ActivityEvent_actorUserId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityEvent" DROP CONSTRAINT "ActivityEvent_groupId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityEvent" DROP CONSTRAINT "ActivityEvent_matchId_groupId_fkey";

-- DropTable
DROP TABLE "ActivityEvent";

-- DropEnum
DROP TYPE "ActivityEventType";

-- CreateTable
CREATE TABLE "FeedItem" (
    "id" TEXT NOT NULL,
    "type" "FeedItemType" NOT NULL,
    "groupId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorGroupMemberId" TEXT,
    "matchId" TEXT,
    "importanceScore" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeedItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedItem_groupId_occurredAt_idx" ON "FeedItem"("groupId", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedItem_type_occurredAt_idx" ON "FeedItem"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedItem_importanceScore_occurredAt_idx" ON "FeedItem"("importanceScore", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedItem_actorUserId_occurredAt_idx" ON "FeedItem"("actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedItem_actorGroupMemberId_occurredAt_idx" ON "FeedItem"("actorGroupMemberId", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedItem_matchId_idx" ON "FeedItem"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedItem_type_matchId_key" ON "FeedItem"("type", "matchId");

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_actorGroupMemberId_groupId_fkey" FOREIGN KEY ("actorGroupMemberId", "groupId") REFERENCES "GroupMember"("id", "groupId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_matchId_groupId_fkey" FOREIGN KEY ("matchId", "groupId") REFERENCES "Match"("id", "groupId") ON DELETE CASCADE ON UPDATE CASCADE;
