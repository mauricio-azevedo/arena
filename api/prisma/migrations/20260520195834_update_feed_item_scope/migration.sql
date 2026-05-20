/*
  Warnings:

  - Added the required column `scope` to the `FeedItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `visibility` to the `FeedItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeedItemScope" AS ENUM ('GROUP', 'USER');

-- CreateEnum
CREATE TYPE "FeedItemVisibility" AS ENUM ('GROUP_MEMBERS', 'SOCIAL_CIRCLE', 'PUBLIC', 'PRIVATE');

-- DropForeignKey
ALTER TABLE "FeedItem" DROP CONSTRAINT "FeedItem_actorGroupMemberId_groupId_fkey";

-- DropForeignKey
ALTER TABLE "FeedItem" DROP CONSTRAINT "FeedItem_matchId_groupId_fkey";

-- AlterTable
ALTER TABLE "FeedItem"
    ADD COLUMN "scope" "FeedItemScope" NOT NULL DEFAULT 'GROUP',
ADD COLUMN "subjectUserId" TEXT,
ADD COLUMN "visibility" "FeedItemVisibility" NOT NULL DEFAULT 'SOCIAL_CIRCLE',
ALTER COLUMN "groupId" DROP NOT NULL;

ALTER TABLE "FeedItem" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "FeedItem" ALTER COLUMN "visibility" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "FeedItem_scope_occurredAt_idx" ON "FeedItem"("scope", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedItem_visibility_occurredAt_idx" ON "FeedItem"("visibility", "occurredAt");

-- CreateIndex
CREATE INDEX "FeedItem_subjectUserId_occurredAt_idx" ON "FeedItem"("subjectUserId", "occurredAt");

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_actorGroupMemberId_fkey" FOREIGN KEY ("actorGroupMemberId") REFERENCES "GroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
