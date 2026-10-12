-- CreateEnum
CREATE TYPE "ActivityEventType" AS ENUM ('GROUP_CREATED', 'MEMBER_JOINED', 'MATCH_CLOSE', 'MATCH_BLOWOUT', 'UPSET_WIN');

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "type" "ActivityEventType" NOT NULL,
    "groupId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorGroupMemberId" TEXT,
    "matchId" TEXT,
    "metadata" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityEvent_groupId_occurredAt_idx" ON "ActivityEvent"("groupId", "occurredAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_type_occurredAt_idx" ON "ActivityEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_actorUserId_occurredAt_idx" ON "ActivityEvent"("actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_actorGroupMemberId_occurredAt_idx" ON "ActivityEvent"("actorGroupMemberId", "occurredAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_matchId_idx" ON "ActivityEvent"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityEvent_type_matchId_key" ON "ActivityEvent"("type", "matchId");

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_actorGroupMemberId_fkey" FOREIGN KEY ("actorGroupMemberId") REFERENCES "GroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
